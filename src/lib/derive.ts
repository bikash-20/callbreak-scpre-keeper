/**
 * Derived match state.
 *
 * Cumulative scores, rankings and winners are ALWAYS computed from the
 * saved round records — they are never persisted. This means editing or
 * undoing a round can never leave a stale total behind, because there is no
 * stored total to become stale.
 */

import type {
  Match,
  Ranking,
  RoundSummary,
  WinnerResult,
} from '../types/match';
import { getScoringRule, pointsToUnits } from './scoring';

/**
 * Recomputes the round score for an entry from its inputs. The stored
 * `roundScore` is treated as a cache; this is the source of truth so that
 * editing a round (or changing scoring mode) always yields correct maths.
 */
export function recomputeEntryScore(
  match: Match,
  entry: { bid: number; tricksWon: number },
): number {
  const rule = getScoringRule(match.scoringMode);
  return rule.scoreRound(entry.bid, entry.tricksWon);
}

/**
 * Cumulative score per player id, in tenths of a point.
 * Rounds are folded in order so the result always reflects the true history.
 */
export function cumulativeScores(match: Match): Map<string, number> {
  const totals = new Map<string, number>();
  for (const player of match.players) {
    totals.set(player.id, 0);
  }
  for (const round of match.rounds) {
    for (const entry of round.playerEntries) {
      const score = recomputeEntryScore(match, entry);
      totals.set(entry.playerId, (totals.get(entry.playerId) ?? 0) + score);
    }
  }
  return totals;
}

/**
 * Players ordered by cumulative score (descending).
 * Ties share a rank: 1, 1, 3 (competition ranking).
 */
export function rankings(match: Match): Ranking[] {
  const totals = cumulativeScores(match);
  const rows = match.players.map((player) => ({
    playerId: player.id,
    score: totals.get(player.id) ?? 0,
    rank: 0,
  }));

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Stable, deterministic ordering for equal scores: by seat.
    const seatA = match.players.find((p) => p.id === a.playerId)?.seatIndex ?? 0;
    const seatB = match.players.find((p) => p.id === b.playerId)?.seatIndex ?? 0;
    return seatA - seatB;
  });

  let lastScore: number | null = null;
  let lastRank = 0;
  rows.forEach((row, index) => {
    if (lastScore !== null && row.score === lastScore) {
      row.rank = lastRank;
    } else {
      row.rank = index + 1;
      lastRank = row.rank;
      lastScore = row.score;
    }
  });

  return rows;
}

/**
 * Determines the winner of a match.
 *
 * A player qualifies when their cumulative score reaches or exceeds the
 * target score. Because all four scores update at the end of a round, several
 * players may qualify in the same round:
 *   - the highest qualifying score wins;
 *   - if the highest qualifying scores are equal, it is a tie.
 *
 * Returns null when no player has reached the target.
 */
export function evaluateWinner(match: Match): WinnerResult | null {
  const target = pointsToUnits(match.targetScore);
  const totals = cumulativeScores(match);

  const qualifying = match.players
    .map((player) => ({ playerId: player.id, score: totals.get(player.id) ?? 0 }))
    .filter((row) => row.score >= target);

  if (qualifying.length === 0) return null;

  const topScore = Math.max(...qualifying.map((row) => row.score));
  const winnerIds = qualifying
    .filter((row) => row.score === topScore)
    .map((row) => row.playerId);

  return {
    winnerIds,
    isTie: winnerIds.length > 1,
    topScore,
  };
}

/**
 * Per-round history with the cumulative score standing after each round.
 * Used by the history and summary screens.
 */
export function roundSummaries(match: Match): RoundSummary[] {
  const totals = new Map<string, number>();
  for (const player of match.players) {
    totals.set(player.id, 0);
  }

  return match.rounds.map((round) => {
    for (const entry of round.playerEntries) {
      const score = recomputeEntryScore(match, entry);
      totals.set(entry.playerId, (totals.get(entry.playerId) ?? 0) + score);
    }
    const cumulativeAfter: Record<string, number> = {};
    for (const [playerId, score] of totals) {
      cumulativeAfter[playerId] = score;
    }
    return { round, cumulativeAfter };
  });
}

/** The most recent round score for each player, in tenths of a point. */
export function latestRoundScores(match: Match): Map<string, number> {
  const latest = new Map<string, number>();
  const lastRound = match.rounds[match.rounds.length - 1];
  if (!lastRound) return latest;
  for (const entry of lastRound.playerEntries) {
    latest.set(entry.playerId, recomputeEntryScore(match, entry));
  }
  return latest;
}

/**
 * Cumulative score for a single player, in tenths of a point.
 */
export function playerScore(match: Match, playerId: string): number {
  return cumulativeScores(match).get(playerId) ?? 0;
}
