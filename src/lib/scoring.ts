/**
 * Scoring engine — pure functions, no UI or storage imports.
 *
 * Scores are represented as integers in tenths of a point ("units").
 *   3.0 points -> 30 units
 *   3.2 points -> 32 units
 *  -4.0 points -> -40 units
 *
 * Using integers means repeated addition across many rounds can never
 * accumulate floating-point error, and the arithmetic stays exact.
 */

import type { ScoringMode } from '../types/match';

/** Number of units in one whole point. */
export const SCORE_SCALE = 10;

/**
 * Standard Callbreak scoring.
 *
 * Made the bid:  score = bid + (tricksWon - bid) / 10
 * Failed the bid: score = -bid
 *
 * Examples:
 *   bid 3, won 3 -> +3.0
 *   bid 3, won 5 -> +3.2
 *   bid 4, won 2 -> -4.0
 */
export function calculateRoundScore(bid: number, tricksWon: number): number {
  if (tricksWon >= bid) {
    return bid * SCORE_SCALE + (tricksWon - bid);
  }
  return -bid * SCORE_SCALE;
}

/**
 * A scoring mode describes how a single round is scored.
 * Adding a new mode means registering one of these — no UI changes needed.
 */
export interface ScoringRule {
  id: ScoringMode;
  label: string;
  description: string;
  /** Score for one round, in tenths of a point. */
  scoreRound: (bid: number, tricksWon: number) => number;
}

export const STANDARD_RULE: ScoringRule = {
  id: 'standard',
  label: 'Standard Callbreak',
  description:
    'Make your bid to score it, plus 0.1 for every extra trick. Miss your bid and lose it.',
  scoreRound: calculateRoundScore,
};

/** Registry of available scoring modes. */
export const SCORING_RULES: Record<ScoringMode, ScoringRule> = {
  standard: STANDARD_RULE,
};

export function getScoringRule(mode: ScoringMode): ScoringRule {
  const rule = SCORING_RULES[mode];
  if (!rule) {
    // Fall back to standard rather than throwing — a corrupt stored mode
    // must never make the app unusable.
    return STANDARD_RULE;
  }
  return rule;
}

/**
 * Formats a score given in units as a string with one decimal place.
 *   32  -> "3.2"
 *   30  -> "3.0"
 *   -40 -> "-4.0"
 */
export function formatScore(units: number): string {
  const value = units / SCORE_SCALE;
  // Guard against -0 (e.g. -0.04 should not render as "-0.0").
  const safe = Object.is(value, -0) ? 0 : value;
  return safe.toFixed(1);
}

/** Formats a score with an explicit sign, for deltas like "+3.2" / "-4.0". */
export function formatSignedScore(units: number): string {
  const text = formatScore(Math.abs(units));
  if (units > 0) return `+${text}`;
  if (units < 0) return `-${text}`;
  return text;
}

/** Converts whole points into tenths-of-a-point units. */
export function pointsToUnits(points: number): number {
  return Math.round(points * SCORE_SCALE);
}

/** Converts tenths-of-a-point units into whole points. */
export function unitsToPoints(units: number): number {
  return units / SCORE_SCALE;
}
