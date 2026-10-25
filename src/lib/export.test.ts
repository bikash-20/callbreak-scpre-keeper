import { describe, expect, it } from 'vitest';
import type { Match } from '../types/match';
import { calculateRoundScore } from './scoring';
import {
  csvCell,
  describeResult,
  exportFileBaseName,
  exportMatchToCsv,
  exportMatchToText,
  toCsv,
} from './export';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    name: 'Friday Match',
    players: [
      { id: 'p1', name: 'Joy', seatIndex: 0 },
      { id: 'p2', name: 'Bikash', seatIndex: 1 },
      { id: 'p3', name: 'Plabon', seatIndex: 2 },
      { id: 'p4', name: 'Sumon', seatIndex: 3 },
    ],
    targetScore: 50,
    scoringMode: 'standard',
    status: 'completed',
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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T01:00:00.000Z',
    schemaVersion: 1,
    enforceTrickTotal: true,
    expectedTrickTotal: 13,
    ...overrides,
  };
}

describe('csvCell', () => {
  it('leaves plain values unquoted', () => {
    expect(csvCell('Joy')).toBe('Joy');
    expect(csvCell(42)).toBe('42');
  });

  it('quotes values containing commas', () => {
    expect(csvCell('Joy, Jr')).toBe('"Joy, Jr"');
  });

  it('quotes values containing quotes and escapes them', () => {
    expect(csvCell('He said "hi"')).toBe('"He said ""hi"""');
  });

  it('quotes values containing newlines', () => {
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('toCsv', () => {
  it('joins rows with newlines and cells with commas', () => {
    expect(toCsv([['a', 'b'], ['c', 'd']])).toBe('a,b\nc,d');
  });
});

describe('exportMatchToCsv', () => {
  const csv = exportMatchToCsv(makeMatch());

  it('includes the match metadata', () => {
    expect(csv).toContain('Match,Friday Match');
    expect(csv).toContain('Target score,50');
    expect(csv).toContain('Scoring mode,Standard Callbreak');
  });

  it('includes the player names', () => {
    expect(csv).toContain('Joy');
    expect(csv).toContain('Bikash');
    expect(csv).toContain('Plabon');
    expect(csv).toContain('Sumon');
  });

  it('includes each round input, round score and cumulative score', () => {
    // Round 1, Joy bid 3 won 5 -> +3.2
    expect(csv).toContain('1,Joy,3,5,3.2,3.2');
    // Round 1, Bikash bid 4 won 2 -> -4.0
    expect(csv).toContain('1,Bikash,4,2,-4.0,-4.0');
  });

  it('includes the final standings and the result', () => {
    expect(csv).toContain('Final standings');
    expect(csv).toContain('Result');
  });

  it('escapes a match name containing a comma', () => {
    const tricky = exportMatchToCsv(makeMatch({ name: 'Joy, Bikash vs Plabon' }));
    expect(tricky).toContain('"Joy, Bikash vs Plabon"');
  });

  it('localizes CSV labels and numeric values in Bengali', () => {
    const csv = exportMatchToCsv(makeMatch(), 'bn');
    expect(csv).toContain('ম্যাচ,Friday Match');
    expect(csv).toContain('লক্ষ্য স্কোর,৫০');
    expect(csv).toContain('অবস্থা,সম্পন্ন');
    expect(csv).toContain('১,Joy,৩,৫,৩.২,৩.২');
    expect(csv).toContain('১,Bikash,৪,২,-৪.০,-৪.০');
  });
});

describe('exportMatchToText', () => {
  const text = exportMatchToText(makeMatch());

  it('includes the match name, target and scoring mode', () => {
    expect(text).toContain('FRIDAY MATCH');
    expect(text).toContain('Target: 50 points');
    expect(text).toContain('Standard Callbreak');
  });

  it('includes the final standings with scores', () => {
    expect(text).toContain('Final standings');
    expect(text).toContain('Joy');
    expect(text).toContain('3.2');
  });

  it('includes the round-by-round breakdown', () => {
    expect(text).toContain('Round by round');
    expect(text).toContain('R1:');
    expect(text).toContain('Joy 3/5 (3.2)');
  });

  it('includes the number of rounds played', () => {
    expect(text).toContain('Rounds played:* 1');
  });

  it('declares the winner when the target is reached', () => {
    const winnerMatch = makeMatch({ targetScore: 3 });
    expect(describeResult(winnerMatch, null)).toBe(
      'No winner — target of 3 points was not reached.',
    );
  });

  it('uses Bengali labels and digits when exporting text', () => {
    const text = exportMatchToText(makeMatch(), 'bn');
    expect(text).toContain('লক্ষ্য: ৫০ পয়েন্ট');
    expect(text).toContain('রাউন্ড ১:');
    expect(text).toContain('Joy ৩/৫ (৩.২)');
  });
});

describe('describeResult', () => {
  it('names a single winner', () => {
    const match = makeMatch({ targetScore: 3 });
    // p1 = 32, p2 = -40, p3 = 22, p4 = -40 -> Joy wins with 3.2
    const result = describeResult(match, {
      winnerIds: ['p1'],
      isTie: false,
      topScore: 32,
    });
    expect(result).toBe('Joy wins with 3.2 points.');
  });

  it('names a tie without picking a winner', () => {
    const result = describeResult(makeMatch(), {
      winnerIds: ['p1', 'p2'],
      isTie: true,
      topScore: 40,
    });
    expect(result).toBe('Tie between Joy & Bikash at 4.0 points.');
  });
});

describe('export is read-only', () => {
  it('does not mutate the saved match', () => {
    const match = makeMatch();
    const before = JSON.stringify(match);

    exportMatchToCsv(match);
    exportMatchToText(match);
    describeResult(match, null);
    exportFileBaseName(match);

    expect(JSON.stringify(match)).toBe(before);
  });
});

describe('exportFileBaseName', () => {
  it('slugifies the match name', () => {
    expect(exportFileBaseName(makeMatch({ name: 'Friday Match' }))).toBe('friday-match');
  });

  it('strips characters that are unsafe in filenames', () => {
    expect(exportFileBaseName(makeMatch({ name: 'Joy/Bikash: "the" match' }))).toBe(
      'joy-bikash-the-match',
    );
  });

  it('falls back to a default when the name has no usable characters', () => {
    expect(exportFileBaseName(makeMatch({ name: '///' }))).toBe('callbreak-match');
  });
});
