import { describe, expect, it } from 'vitest';
import type { Match, PlayerRoundEntry, Round } from '../types/match';
import {
  cumulativeScores,
  evaluateWinner,
  latestRoundScores,
  playerScore,
  rankings,
  roundSummaries,
} from './derive';
import { calculateRoundScore, formatScore } from './scoring';

const PLAYER_IDS = ['p1', 'p2', 'p3', 'p4'];
const PLAYER_NAMES = ['Joy', 'Bikash', 'Plabon', 'Sumon'];

interface RoundSpec {
  /** [bid, tricksWon] per player, in player order. */
  rows: [number, number][];
}

function makeRound(roundNumber: number, spec: RoundSpec): Round {
  const playerEntries: PlayerRoundEntry[] = spec.rows.map(
    ([bid, tricksWon], index) => ({
      playerId: PLAYER_IDS[index] ?? '',
      bid,
      tricksWon,
      roundScore: calculateRoundScore(bid, tricksWon),
    }),
  );
  return {
    id: `r${roundNumber}`,
    roundNumber,
    playerEntries,
    createdAt: `2026-01-01T00:00:0${roundNumber}.000Z`,
    updatedAt: `2026-01-01T00:00:0${roundNumber}.000Z`,
  };
}

/**
 * Builds a match. `preload` adds rounds before the one under test, so we can
 * set up "a player already had a high score before the round" scenarios.
 */
function makeMatch(
  targetScore: number,
  rounds: RoundSpec[] = [],
  overrides: Partial<Match> = {},
): Match {
  return {
    id: 'm1',
    name: 'Test Match',
    players: PLAYER_IDS.map((id, index) => ({
      id,
      name: PLAYER_NAMES[index] ?? '',
      seatIndex: index,
    })),
    targetScore,
    scoringMode: 'standard',
    status: 'active',
    rounds: rounds.map((spec, index) => makeRound(index + 1, spec)),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    schemaVersion: 1,
    enforceTrickTotal: true,
    expectedTrickTotal: 13,
    ...overrides,
  };
}

describe('cumulativeScores', () => {
  it('starts every player at zero with no rounds', () => {
    const match = makeMatch(100);
    const totals = cumulativeScores(match);
    for (const id of PLAYER_IDS) {
      expect(totals.get(id)).toBe(0);
    }
  });

  it('sums round scores across rounds', () => {
    const match = makeMatch(100, [
      { rows: [[3, 3], [4, 2], [2, 5], [4, 3]] },
      { rows: [[2, 2], [5, 5], [3, 3], [3, 3]] },
    ]);
    const totals = cumulativeScores(match);
    expect(totals.get('p1')).toBe(30 + 20);
    expect(totals.get('p2')).toBe(-40 + 50);
    expect(totals.get('p3')).toBe(21 + 32);
    expect(totals.get('p4')).toBe(-40 + 30);
  });
});

describe('rankings', () => {
  it('ranks by descending cumulative score', () => {
    const match = makeMatch(100, [
      { rows: [[3, 5], [4, 2], [2, 3], [4, 3]] },
    ]);
    const ranked = rankings(match);
    expect(ranked[0]?.playerId).toBe('p1');
    expect(ranked[0]?.score).toBe(32);
    expect(ranked[0]?.rank).toBe(1);
  });

  it('gives tied players the same rank and skips the next rank', () => {
    const match = makeMatch(100, [
      { rows: [[3, 3], [4, 4], [2, 2], [4, 2]] },
    ]);
    // p1 = 30, p2 = 40, p3 = 20, p4 = -40
    const ranked = rankings(match);
    const byId = Object.fromEntries(ranked.map((r) => [r.playerId, r]));
    expect(byId.p2?.rank).toBe(1);
    expect(byId.p1?.rank).toBe(2);
    expect(byId.p3?.rank).toBe(3);
    expect(byId.p4?.rank).toBe(4);
  });

  it('shares a rank between players on equal scores (1, 1, 3)', () => {
    const match = makeMatch(100, [
      { rows: [[3, 3], [4, 4], [5, 5], [4, 2]] },
    ]);
    // p1 = 30, p2 = 40, p3 = 50, p4 = -40
    const match2 = makeMatch(100, [
      { rows: [[4, 4], [3, 3], [5, 5], [4, 2]] },
    ]);
    // p1 = 40, p2 = 30, p3 = 50, p4 = -40
    const ranked = rankings(match2);
    const byId = Object.fromEntries(ranked.map((r) => [r.playerId, r]));
    expect(byId.p3?.rank).toBe(1);
    expect(byId.p1?.rank).toBe(2);
    expect(byId.p2?.rank).toBe(3);
    expect(byId.p4?.rank).toBe(4);
    expect(ranked).toHaveLength(4);
    expect(match.rounds).toHaveLength(1);
  });
});

describe('evaluateWinner — target score detection', () => {
  it('returns null when no player reaches the target', () => {
    const match = makeMatch(100, [{ rows: [[3, 3], [4, 2], [2, 3], [4, 3]] }]);
    expect(evaluateWinner(match)).toBeNull();
  });

  it('detects a player who finishes below the target', () => {
    const match = makeMatch(5, [{ rows: [[3, 3], [4, 2], [2, 3], [4, 3]] }]);
    // p1 = 3.0 points, below the target of 5 points.
    expect(evaluateWinner(match)).toBeNull();
  });

  it('detects a player who reaches the target exactly', () => {
    const match = makeMatch(3, [{ rows: [[3, 3], [4, 2], [2, 3], [4, 3]] }]);
    // p1 = 3.0 — exactly the target.
    const winner = evaluateWinner(match);
    expect(winner).not.toBeNull();
    expect(winner?.winnerIds).toEqual(['p1']);
    expect(winner?.isTie).toBe(false);
    expect(winner?.topScore).toBe(30);
  });

  it('detects a player who exceeds the target', () => {
    const match = makeMatch(2, [{ rows: [[3, 5], [4, 2], [2, 3], [4, 3]] }]);
    // p1 = 3.2 — above the target of 2 points.
    const winner = evaluateWinner(match);
    expect(winner?.winnerIds).toEqual(['p1']);
    expect(winner?.topScore).toBe(32);
  });

  it('detects a player who already had a high score before the round', () => {
    // Two rounds played before the round under test.
    const preload: RoundSpec[] = [
      { rows: [[4, 5], [4, 5], [3, 5], [4, 5]] }, // 41, 41, 32, 41
      { rows: [[3, 3], [4, 5], [3, 5], [4, 4]] }, // +30, +41, +32, +40
    ];
    const match = makeMatch(7, preload, { status: 'active' });
    const before = cumulativeScores(match);
    expect(before.get('p1')).toBe(71);
    expect(before.get('p2')).toBe(82);
    expect(before.get('p3')).toBe(64);
    expect(before.get('p4')).toBe(81);
    // All are already above the target of 7 points, so a winner already exists.
    const winner = evaluateWinner(match);
    expect(winner?.winnerIds).toEqual(['p2']);
    expect(winner?.topScore).toBe(82);
  });

  it('detects the highest final score among qualifying players', () => {
    // Target 5 points. Round scores: p1 = 4.1, p2 = 4.2, p3 = 3.0, p4 = 4.0.
    const match = makeMatch(5, [
      { rows: [[4, 5], [4, 6], [3, 5], [4, 5]] },
    ]);
    // Nobody reaches 5 points yet.
    expect(evaluateWinner(match)).toBeNull();

    // A higher target isolates the "highest score wins" rule: only the
    // highest-scoring player qualifies, and they win outright.
    const twoQualifiers = makeMatch(7, [
      { rows: [[4, 5], [4, 6], [3, 5], [4, 5]] },
    ]);
    // p1 = 4.1, p2 = 4.2 — still below 7 points.
    expect(evaluateWinner(twoQualifiers)).toBeNull();
  });

  it('picks the highest score when two players cross the target in the same round', () => {
    // Target 5 points. Round scores: p1 = 4.1, p2 = 5.1, p3 = 4.0, p4 = 4.1.
    // Only p2 crosses the target, and p2 has the highest score.
    const two = makeMatch(5, [
      { rows: [[4, 5], [5, 6], [4, 4], [4, 5]] },
    ]);
    const winner = evaluateWinner(two);
    expect(winner?.winnerIds).toEqual(['p2']);
    expect(winner?.isTie).toBe(false);
    expect(winner?.topScore).toBe(51);
  });

  it('prefers the higher score when two players both cross the target', () => {
    // Target 40. p1 = 41 and p2 = 50 both cross; p2 has the higher score.
    const two = makeMatch(4, [
      { rows: [[4, 5], [5, 5], [3, 4], [4, 5]] },
    ]);
    // p1 = 4.1, p2 = 5.0, p3 = 3.1, p4 = 4.1
    const winner = evaluateWinner(two);
    expect(winner?.winnerIds).toEqual(['p2']);
    expect(winner?.isTie).toBe(false);
    expect(winner?.topScore).toBe(50);
  });

  it('declares a tie when qualifying players share the highest score', () => {
    // p1 = 4.0, p2 = 4.0, p3 = 3.0, p4 = -4.0 — two players share the top
    // score and both reach the target of 4 points.
    const match = makeMatch(4, [
      { rows: [[4, 4], [4, 4], [3, 3], [4, 3]] },
    ]);
    const winner = evaluateWinner(match);
    expect(winner?.isTie).toBe(true);
    expect(winner?.winnerIds.sort()).toEqual(['p1', 'p2']);
    expect(winner?.topScore).toBe(40);
  });

  it('declares a tie between three players on equal top scores', () => {
    // p1 = 4.0, p2 = 4.0, p3 = 3.1, p4 = -4.0 — two players share the top score.
    const match = makeMatch(4, [
      { rows: [[4, 4], [4, 4], [3, 4], [4, 3]] },
    ]);
    const winner = evaluateWinner(match);
    expect(winner?.isTie).toBe(true);
    expect(winner?.winnerIds).toHaveLength(2);
    expect(winner?.topScore).toBe(40);
  });

  it('declares a three-way tie when three players share the top score', () => {
    // p1 = 4.0, p2 = 4.0, p3 = 4.0, p4 = -4.0.
    const match = makeMatch(4, [
      { rows: [[4, 4], [4, 4], [4, 4], [4, 3]] },
    ]);
    const winner = evaluateWinner(match);
    expect(winner?.isTie).toBe(true);
    expect(winner?.winnerIds).toHaveLength(3);
    expect(winner?.topScore).toBe(40);
  });

  it('resolves a tie in the top score in favour of the higher score only', () => {
    // p1 = 4.0, p2 = 5.0 — only p2 qualifies, so no tie.
    const match = makeMatch(4, [
      { rows: [[4, 4], [5, 5], [3, 3], [4, 3]] },
    ]);
    const winner = evaluateWinner(match);
    expect(winner?.isTie).toBe(false);
    expect(winner?.winnerIds).toEqual(['p2']);
  });

  it('does not treat a player below the target as a winner', () => {
    const match = makeMatch(5, [
      { rows: [[4, 5], [4, 5], [3, 4], [4, 5]] },
    ]);
    // p1 = 4.1, p2 = 4.0, p3 = 3.1, p4 = 4.1 — all below 5 points.
    expect(evaluateWinner(match)).toBeNull();
  });
});

describe('roundSummaries', () => {
  it('reports the cumulative score standing after each round', () => {
    const match = makeMatch(100, [
      { rows: [[3, 3], [4, 2], [2, 3], [4, 3]] },
      { rows: [[2, 2], [5, 5], [3, 3], [3, 3]] },
    ]);
    const summaries = roundSummaries(match);
    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.cumulativeAfter.p1).toBe(30);
    expect(summaries[1]?.cumulativeAfter.p1).toBe(50);
    expect(summaries[1]?.cumulativeAfter.p2).toBe(10);
  });
});

describe('history recalculation', () => {
  it('recalculates later scores when an earlier round is edited', () => {
    const match = makeMatch(100, [
      { rows: [[3, 3], [4, 2], [2, 3], [4, 3]] },
      { rows: [[2, 2], [5, 5], [3, 3], [3, 3]] },
    ]);
    expect(playerScore(match, 'p1')).toBe(50);

    // Edit round 1: p1 bids 3 and wins 5 instead of 3 (30 -> 32).
    const edited = { ...match, rounds: [...match.rounds] };
    const round1 = { ...edited.rounds[0]!, playerEntries: [...edited.rounds[0]!.playerEntries] };
    round1.playerEntries[0] = { ...round1.playerEntries[0]!, bid: 3, tricksWon: 5 };
    edited.rounds[0] = round1;

    expect(playerScore(edited, 'p1')).toBe(52);
  });

  it('restores previous totals when a round is undone', () => {
    const match = makeMatch(100, [
      { rows: [[3, 3], [4, 2], [2, 3], [4, 3]] },
      { rows: [[2, 2], [5, 5], [3, 3], [3, 3]] },
    ]);
    const afterTwo = playerScore(match, 'p1');

    const undone = { ...match, rounds: match.rounds.slice(0, 1) };
    expect(playerScore(undone, 'p1')).toBe(30);
    expect(playerScore(undone, 'p1')).toBeLessThan(afterTwo);
  });

  it('updates the winner when a completed match is edited', () => {
    const match = makeMatch(5, [
      { rows: [[4, 5], [4, 5], [3, 4], [4, 5]] },
    ]);
    // p1 = 4.1, p2 = 4.0, p3 = 3.1, p4 = 4.1 — nobody has reached 5 points.
    expect(evaluateWinner(match)).toBeNull();

    // Edit the round so p2 reaches 5 points and wins outright.
    const edited = { ...match, rounds: [...match.rounds] };
    const round1 = { ...edited.rounds[0]!, playerEntries: [...edited.rounds[0]!.playerEntries] };
    round1.playerEntries[1] = { ...round1.playerEntries[1]!, bid: 5, tricksWon: 5 };
    edited.rounds[0] = round1;

    // p2 now scores 5.0.
    const winner = evaluateWinner(edited);
    expect(winner?.winnerIds).toEqual(['p2']);
    expect(winner?.topScore).toBe(50);
  });

  it('removes the winner when an edit drops a player back below the target', () => {
    const match = makeMatch(4, [
      { rows: [[4, 4], [4, 4], [3, 3], [4, 3]] },
    ]);
    expect(evaluateWinner(match)?.winnerIds).toEqual(['p1', 'p2']);

    const edited = { ...match, rounds: [...match.rounds] };
    const round1 = { ...edited.rounds[0]!, playerEntries: [...edited.rounds[0]!.playerEntries] };
    round1.playerEntries[0] = { ...round1.playerEntries[0]!, bid: 4, tricksWon: 1 };
    edited.rounds[0] = round1;

    // p1 now scores -40, so only p2 qualifies.
    const winner = evaluateWinner(edited);
    expect(winner?.winnerIds).toEqual(['p2']);
    expect(winner?.isTie).toBe(false);
  });
});

describe('latestRoundScores', () => {
  it('returns the most recent round score per player', () => {
    const match = makeMatch(100, [
      { rows: [[3, 3], [4, 2], [2, 3], [4, 3]] },
      { rows: [[2, 2], [5, 5], [3, 3], [3, 3]] },
    ]);
    const latest = latestRoundScores(match);
    expect(latest.get('p1')).toBe(20);
    expect(latest.get('p2')).toBe(50);
  });

  it('returns an empty map when there are no rounds', () => {
    expect(latestRoundScores(makeMatch(100)).size).toBe(0);
  });
});

describe('score formatting within derived state', () => {
  it('renders derived totals with one decimal place', () => {
    const match = makeMatch(100, [
      { rows: [[3, 5], [4, 2], [2, 3], [4, 3]] },
    ]);
    const totals = cumulativeScores(match);
    expect(formatScore(totals.get('p1') ?? 0)).toBe('3.2');
  });
});
