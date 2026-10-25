import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// `fake-indexeddb/auto` installs the full set of IndexedDB globals
// (indexedDB, IDBRequest, IDBKeyRange, ...) exactly as a browser provides.
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { SCHEMA_VERSION, type Match } from '../types/match';
import { calculateRoundScore } from './scoring';

// Each test gets a pristine IndexedDB implementation so state never leaks
// between cases.
let factory: IDBFactory;

beforeEach(() => {
  factory = new IDBFactory();
  globalThis.indexedDB = factory;
  // Reset the module's cached connection so it reopens against the new
  // factory. `vi.resetModules` + dynamic import gives us a fresh instance.
  vi.resetModules();
});

afterEach(() => {
  vi.resetModules();
});

async function loadDb() {
  const mod = await import('./db');
  return mod;
}

function makeMatch(id: string, overrides: Partial<Match> = {}): Match {
  return {
    id,
    name: `Match ${id}`,
    players: [
      { id: 'p1', name: 'Joy', seatIndex: 0 },
      { id: 'p2', name: 'Bikash', seatIndex: 1 },
      { id: 'p3', name: 'Plabon', seatIndex: 2 },
      { id: 'p4', name: 'Sumon', seatIndex: 3 },
    ],
    targetScore: 100,
    scoringMode: 'standard',
    status: 'active',
    rounds: [],
    createdAt: `2026-01-0${id}T00:00:00.000Z`,
    updatedAt: `2026-01-0${id}T00:00:00.000Z`,
    completedAt: null,
    schemaVersion: 1,
    enforceTrickTotal: true,
    expectedTrickTotal: 13,
    ...overrides,
  };
}

describe('persistence', () => {
  it('saves a match and reads it back', async () => {
    const db = await loadDb();
    const match = makeMatch('1');
    await db.putMatch(match);

    const { matches } = await db.listMatches();
    expect(matches).toHaveLength(1);
    expect(matches[0]?.id).toBe('1');
    expect(matches[0]?.targetScore).toBe(100);
  });

  it('survives a reload — data persists across a fresh database connection', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1'));

    // A fresh module instance reopens the same database from disk.
    vi.resetModules();
    const reloaded = await loadDb();
    const { matches } = await reloaded.listMatches();
    expect(matches).toHaveLength(1);
    expect(matches[0]?.name).toBe('Match 1');
  });

  it('resumes an active match with its rounds intact', async () => {
    const db = await loadDb();
    const match = makeMatch('1', {
      status: 'active',
      rounds: [
        {
          id: 'r1',
          roundNumber: 1,
          playerEntries: [
            { playerId: 'p1', bid: 3, tricksWon: 5, roundScore: calculateRoundScore(3, 5) },
            { playerId: 'p2', bid: 4, tricksWon: 2, roundScore: calculateRoundScore(4, 2) },
            { playerId: 'p3', bid: 2, tricksWon: 3, roundScore: calculateRoundScore(2, 3) },
            { playerId: 'p4', bid: 4, tricksWon: 3, roundScore: calculateRoundScore(4, 3) },
          ],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    await db.putMatch(match);

    const fetched = await db.getMatch('1');
    expect(fetched?.status).toBe('active');
    expect(fetched?.rounds).toHaveLength(1);
    expect(fetched?.rounds[0]?.playerEntries).toHaveLength(4);
  });

  it('keeps a completed match available for review', async () => {
    const db = await loadDb();
    await db.putMatch(
      makeMatch('1', { status: 'completed', completedAt: '2026-01-05T00:00:00.000Z' }),
    );

    const fetched = await db.getMatch('1');
    expect(fetched?.status).toBe('completed');
    expect(fetched?.completedAt).toBe('2026-01-05T00:00:00.000Z');
  });

  it('does not overwrite one match with another', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1', { name: 'First' }));
    await db.putMatch(makeMatch('2', { name: 'Second' }));

    const { matches } = await db.listMatches();
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.name).sort()).toEqual(['First', 'Second']);
  });

  it('replaces a match when the same id is saved again', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1', { name: 'Original' }));
    await db.putMatch(makeMatch('1', { name: 'Renamed' }));

    const { matches } = await db.listMatches();
    expect(matches).toHaveLength(1);
    expect(matches[0]?.name).toBe('Renamed');
  });

  it('deletes a match without touching the others', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1'));
    await db.putMatch(makeMatch('2'));

    await db.deleteMatch('1');
    const { matches } = await db.listMatches();
    expect(matches).toHaveLength(1);
    expect(matches[0]?.id).toBe('2');
  });

  it('returns undefined for a match that does not exist', async () => {
    const db = await loadDb();
    expect(await db.getMatch('missing')).toBeUndefined();
  });

  it('lists matches newest first', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1', { createdAt: '2026-01-01T00:00:00.000Z' }));
    await db.putMatch(makeMatch('2', { createdAt: '2026-06-01T00:00:00.000Z' }));

    const { matches } = await db.listMatches();
    expect(matches[0]?.id).toBe('2');
  });
});

describe('corrupted data', () => {
  it('skips a structurally invalid record instead of throwing', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1'));

    // Write a record that is missing the required shape.
    const raw = factory.open('callbreak-scorekeeper', 2);
    await new Promise<void>((resolve, reject) => {
      raw.onerror = () => reject(raw.error);
      raw.onsuccess = () => {
        const database = raw.result;
        const tx = database.transaction('matches', 'readwrite');
        tx.objectStore('matches').put({ id: 'broken', nonsense: true });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });

    const { matches, skipped } = await db.listMatches();
    expect(matches).toHaveLength(1);
    expect(matches[0]?.id).toBe('1');
    expect(skipped).toBe(1);
  });

  it('does not delete a corrupted record — it stays recoverable', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1'));

    const raw = factory.open('callbreak-scorekeeper', 2);
    await new Promise<void>((resolve, reject) => {
      raw.onerror = () => reject(raw.error);
      raw.onsuccess = () => {
        const database = raw.result;
        const tx = database.transaction('matches', 'readwrite');
        tx.objectStore('matches').put({ id: 'broken', nonsense: true });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });

    await db.listMatches();
    // Reopening and listing again still shows the broken record as skipped,
    // proving it was not silently removed.
    const { skipped } = await db.listMatches();
    expect(skipped).toBe(1);
  });
});

describe('clearAllMatches', () => {
  it('removes every saved match', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1'));
    await db.putMatch(makeMatch('2'));

    await db.clearAllMatches();
    const { matches } = await db.listMatches();
    expect(matches).toHaveLength(0);
  });
});

describe('database migrations', () => {
  it('preserves legacy matches and fills fields introduced in the next schema', async () => {
    const legacy = factory.open('callbreak-scorekeeper', 1);
    const players = makeMatch('legacy').players;
    await new Promise<void>((resolve, reject) => {
      legacy.onerror = () => reject(legacy.error);
      legacy.onupgradeneeded = () => {
        const store = legacy.result.createObjectStore('matches', { keyPath: 'id' });
        store.createIndex('by-createdAt', 'createdAt');
      };
      legacy.onsuccess = () => {
        const database = legacy.result;
        const tx = database.transaction('matches', 'readwrite');
        tx.objectStore('matches').put({
          id: 'legacy',
          name: 'Legacy match',
          players,
          targetScore: 75,
          scoringMode: 'standard',
          status: 'active',
          rounds: [
            {
              id: 'legacy-round',
              roundNumber: 1,
              playerEntries: [
                { playerId: 'p1', bid: 3, tricksWon: 4, roundScore: 31 },
                { playerId: 'p2', bid: 3, tricksWon: 3, roundScore: 30 },
                { playerId: 'p3', bid: 3, tricksWon: 3, roundScore: 30 },
                { playerId: 'p4', bid: 4, tricksWon: 3, roundScore: -40 },
              ],
              createdAt: '2025-01-01T00:10:00.000Z',
              updatedAt: '2025-01-01T00:10:00.000Z',
            },
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
          completedAt: null,
          schemaVersion: 1,
        });
        tx.oncomplete = () => {
          database.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });

    const db = await loadDb();
    const migrated = await db.getMatch('legacy');

    expect(migrated).toMatchObject({
      id: 'legacy',
      name: 'Legacy match',
      targetScore: 75,
      schemaVersion: SCHEMA_VERSION,
      enforceTrickTotal: true,
      expectedTrickTotal: 13,
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(migrated?.rounds[0]?.playerEntries).toHaveLength(4);
    expect(migrated?.rounds[0]?.playerEntries[0]).toMatchObject({
      playerId: 'p1',
      bid: 3,
      tricksWon: 4,
    });
  });
});

describe('atomic match updates', () => {
  it('updates round history without losing the latest match metadata', async () => {
    const db = await loadDb();
    await db.putMatch(makeMatch('1', { name: 'Before update' }));

    const updated = await db.updateMatch('1', (current) => ({
      ...current,
      name: 'After update',
      rounds: [
        {
          id: 'r1',
          roundNumber: 1,
          playerEntries: [
            { playerId: 'p1', bid: 3, tricksWon: 3, roundScore: 30 },
            { playerId: 'p2', bid: 3, tricksWon: 2, roundScore: -30 },
            { playerId: 'p3', bid: 3, tricksWon: 4, roundScore: 31 },
            { playerId: 'p4', bid: 4, tricksWon: 4, roundScore: 40 },
          ],
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    }));

    const fetched = await db.getMatch('1');
    expect(updated.name).toBe('After update');
    expect(fetched?.name).toBe('After update');
    expect(fetched?.rounds).toHaveLength(1);
    expect(fetched?.rounds[0]?.playerEntries).toHaveLength(4);
  });

  it('reports a missing match rather than pretending the update succeeded', async () => {
    const db = await loadDb();

    await expect(db.updateMatch('missing', (match) => match)).rejects.toThrow(
      'That match no longer exists on this device.',
    );
  });
});
