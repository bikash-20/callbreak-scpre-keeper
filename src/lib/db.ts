/**
 * Local persistence — IndexedDB via the `idb` wrapper.
 *
 * Design notes:
 * - One object store, `matches`, keyed by `match.id`; a match and all its
 *   rounds are committed as one atomic record.
 * - Reads are defensive: a record that fails to parse is skipped rather than
 *   thrown away, so one corrupt record can never take down the whole app.
 * - Writes surface clear errors to the UI instead of failing silently.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Match } from '../types/match';
import { SCHEMA_VERSION } from '../types/match';

const DB_NAME = 'callbreak-scorekeeper';
const DB_VERSION = SCHEMA_VERSION;
const STORE = 'matches';

interface CallbreakDB extends DBSchema {
  matches: {
    key: string;
    value: Match;
    indexes: {
      'by-createdAt': string;
      'by-updatedAt': string;
      'by-status': Match['status'];
    };
  };
}

let dbPromise: Promise<IDBPDatabase<CallbreakDB>> | null = null;

function getDb(): Promise<IDBPDatabase<CallbreakDB>> {
  if (!dbPromise) {
    const opening = openDB<CallbreakDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('by-createdAt', 'createdAt');
        }
        const store = transaction.objectStore(STORE);
        if (oldVersion < 2) {
          if (!store.indexNames.contains('by-updatedAt')) {
            store.createIndex('by-updatedAt', 'updatedAt');
          }
          if (!store.indexNames.contains('by-status')) {
            store.createIndex('by-status', 'status');
          }

          const migrateCursor = async () => {
            let cursor = await store.openCursor();
            while (cursor) {
              const previous = cursor.value as Partial<Match>;
              const migrated = {
                ...previous,
                updatedAt:
                  typeof previous.updatedAt === 'string'
                    ? previous.updatedAt
                    : previous.createdAt,
                completedAt:
                  typeof previous.completedAt === 'string'
                    ? previous.completedAt
                    : null,
                schemaVersion: SCHEMA_VERSION,
                enforceTrickTotal:
                  typeof previous.enforceTrickTotal === 'boolean'
                    ? previous.enforceTrickTotal
                    : true,
                expectedTrickTotal:
                  Number.isInteger(previous.expectedTrickTotal)
                    ? previous.expectedTrickTotal
                    : 13,
              };
              if (isMatchLike(migrated)) await cursor.update(migrated);
              cursor = await cursor.continue();
            }
          };
          void migrateCursor().catch(() => {
            try {
              transaction.abort();
            } catch {
              // The IndexedDB transaction may already have aborted itself.
            }
          });
        }
      },
      blocking() {
        // Another tab is holding an older version open. Close ours so the
        // upgrade is not blocked indefinitely.
        dbPromise?.then((db) => db.close());
        dbPromise = null;
      },
      terminated() {
        dbPromise = null;
      },
    });
    dbPromise = opening;
    void opening.catch(() => {
      if (dbPromise === opening) dbPromise = null;
    });
  }
  return dbPromise;
}

/**
 * A storage failure the UI can show a friendly message for.
 */
export class StorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'StorageError';
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

function isMatchLike(value: unknown): value is Match {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Match>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    !Array.isArray(candidate.players) ||
    !Array.isArray(candidate.rounds) ||
    !Number.isSafeInteger(candidate.targetScore) ||
    (candidate.targetScore ?? 0) <= 0 ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string' ||
    (candidate.status !== 'active' && candidate.status !== 'completed')
  ) {
    return false;
  }

  const players = candidate.players;
  const rounds = candidate.rounds;
  if (
    players.length !== 4 ||
    !players.every(
      (player, index) =>
        typeof player.id === 'string' &&
        typeof player.name === 'string' &&
        Number.isInteger(player.seatIndex) &&
        player.seatIndex === index,
    )
  ) {
    return false;
  }

  const playerIds = new Set(players.map((player) => player.id));
  if (playerIds.size !== players.length) return false;

  return rounds.every(
    (round, index) =>
      typeof round.id === 'string' &&
      round.roundNumber === index + 1 &&
      typeof round.createdAt === 'string' &&
      typeof round.updatedAt === 'string' &&
      Array.isArray(round.playerEntries) &&
      round.playerEntries.length === players.length &&
      new Set(round.playerEntries.map((entry) => entry.playerId)).size ===
        players.length &&
      round.playerEntries.every(
        (entry) =>
          playerIds.has(entry.playerId) &&
          Number.isInteger(entry.bid) &&
          Number.isInteger(entry.tricksWon) &&
          Number.isInteger(entry.roundScore),
      )
  );
}

function isQuotaExceeded(cause: unknown): boolean {
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'name' in cause &&
    cause.name === 'QuotaExceededError'
  );
}

function writeFailureMessage(cause: unknown, operation: string): string {
  if (isQuotaExceeded(cause)) {
    return `Could not ${operation} because browser storage is full. Free space and retry; your previously saved matches are unchanged.`;
  }
  return `Could not ${operation}. Your previously saved match data is unchanged.`;
}

/**
 * Lists all matches, newest first.
 *
 * Records that are structurally invalid are skipped (never silently deleted,
 * so they can still be recovered or inspected) and the count of skipped
 * records is reported to the caller.
 */
export async function listMatches(): Promise<{
  matches: Match[];
  skipped: number;
}> {
  try {
    const db = await getDb();
    const rows = await db.getAll(STORE);
    const matches: Match[] = [];
    let skipped = 0;
    for (const row of rows) {
      if (isMatchLike(row)) {
        matches.push(row);
      } else {
        skipped += 1;
      }
    }
    matches.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    return { matches, skipped };
  } catch (cause) {
    throw new StorageError(
      'Could not read saved matches from this device. Your browser may be blocking IndexedDB storage.',
      { cause },
    );
  }
}

/**
 * Fetches a single match by id.
 */
export async function getMatch(id: string): Promise<Match | undefined> {
  try {
    const db = await getDb();
    const row = await db.get(STORE, id);
    if (!row) return undefined;
    if (!isMatchLike(row)) {
      throw new StorageError('That saved match could not be read and may be damaged.');
    }
    return row;
  } catch (cause) {
    if (cause instanceof StorageError) throw cause;
    throw new StorageError('Could not open that saved match.', { cause });
  }
}

/**
 * Creates or replaces a match.
 */
export async function putMatch(match: Match): Promise<void> {
  try {
    const db = await getDb();
    const transaction = db.transaction(STORE, 'readwrite');
    await Promise.all([
      transaction.store.put({ ...match, schemaVersion: SCHEMA_VERSION }),
      transaction.done,
    ]);
  } catch (cause) {
    throw new StorageError(writeFailureMessage(cause, 'save this match'), { cause });
  }
}

/**
 * Updates a match and all of its related round data in one read-write
 * transaction. The updater receives the latest stored value, preventing a
 * stale screen snapshot from overwriting newer match changes.
 */
export async function updateMatch(
  id: string,
  update: (current: Match) => Match,
): Promise<Match> {
  try {
    const db = await getDb();
    const transaction = db.transaction(STORE, 'readwrite');
    const current = await transaction.store.get(id);
    if (!current || !isMatchLike(current)) {
      await transaction.done;
      throw new StorageError('That match no longer exists on this device.');
    }
    let updated: Match;
    try {
      updated = { ...update(current), schemaVersion: SCHEMA_VERSION };
    } catch (cause) {
      await transaction.done;
      throw cause;
    }
    await Promise.all([transaction.store.put(updated), transaction.done]);
    return updated;
  } catch (cause) {
    if (cause instanceof StorageError) throw cause;
    throw new StorageError(writeFailureMessage(cause, 'update this match'), { cause });
  }
}

/**
 * Deletes a match permanently.
 */
export async function deleteMatch(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORE, id);
  } catch (cause) {
    throw new StorageError(writeFailureMessage(cause, 'delete this match'), { cause });
  }
}

/**
 * Requests persistent storage so the browser is less likely to evict saved
 * matches under storage pressure. Best-effort: a refusal is not an error.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Clears all saved matches after the settings screen's explicit confirmation.
 */
export async function clearAllMatches(): Promise<void> {
  try {
    const db = await getDb();
    const transaction = db.transaction(STORE, 'readwrite');
    await Promise.all([transaction.store.clear(), transaction.done]);
  } catch (cause) {
    throw new StorageError('Could not clear saved matches.', { cause });
  }
}
