/**
 * Round-entry validation.
 *
 * Rules:
 * - Bid must be a whole number from 1 to 13.
 * - Tricks won must be a whole number from 0 to 13.
 * - When enforced, the four tricks-won values must sum to the expected
 *   total (13 by default).
 *
 * The user's input is never silently modified — invalid values are reported
 * and the round is refused.
 */

import {
  DEFAULT_TRICK_TOTAL,
  MAX_BID,
  MAX_TRICKS,
  MIN_BID,
  MIN_TRICKS,
} from '../types/match';

/** The raw text a user typed into a numeric field. */
export type RawInput = string;

export interface PlayerInput {
  playerId: string;
  playerName: string;
  bid: RawInput;
  tricksWon: RawInput;
}

export interface FieldIssue {
  playerId: string;
  field: 'bid' | 'tricksWon';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  fieldIssues: FieldIssue[];
  /** Message describing a problem with the total; null when the total is fine. */
  totalIssue: string | null;
  /** Sum of the parsed tricks-won values (0 when any is unparseable). */
  totalTricks: number;
  /** True when every individual field parsed successfully. */
  fieldsValid: boolean;
}

function parseWholeNumber(raw: RawInput): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  // Reject "3.5", "abc", "1e2" and other non-integer input.
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Validates a single player's bid.
 * Returns an error message, or null when the bid is valid.
 */
export function validateBid(raw: RawInput): string | null {
  if (raw.trim() === '') return 'Bid is required';
  const value = parseWholeNumber(raw);
  if (value === null) return 'Bid must be a whole number';
  if (value < MIN_BID || value > MAX_BID) {
    return `Bid must be between ${MIN_BID} and ${MAX_BID}`;
  }
  return null;
}

/**
 * Validates a single player's tricks won.
 * Returns an error message, or null when the value is valid.
 */
export function validateTricksWon(raw: RawInput): string | null {
  if (raw.trim() === '') return 'Tricks won is required';
  const value = parseWholeNumber(raw);
  if (value === null) return 'Tricks won must be a whole number';
  if (value < MIN_TRICKS || value > MAX_TRICKS) {
    return `Tricks won must be between ${MIN_TRICKS} and ${MAX_TRICKS}`;
  }
  return null;
}

/** Parses a tricks-won input into a number, or null when invalid. */
export function parseTricksWon(raw: RawInput): number | null {
  return parseWholeNumber(raw);
}

/** Parses a bid input into a number, or null when invalid. */
export function parseBid(raw: RawInput): number | null {
  return parseWholeNumber(raw);
}

export interface ValidateRoundOptions {
  /** Expected sum of tricks won across all players. */
  expectedTrickTotal?: number;
  /** When false, the total is not checked. */
  enforceTrickTotal?: boolean;
}

/**
 * Validates a whole round of four player entries.
 */
export function validateRound(
  inputs: PlayerInput[],
  options: ValidateRoundOptions = {},
): ValidationResult {
  const {
    expectedTrickTotal = DEFAULT_TRICK_TOTAL,
    enforceTrickTotal = true,
  } = options;

  const fieldIssues: FieldIssue[] = [];

  for (const input of inputs) {
    const bidError = validateBid(input.bid);
    if (bidError) {
      fieldIssues.push({ playerId: input.playerId, field: 'bid', message: bidError });
    }
    const tricksError = validateTricksWon(input.tricksWon);
    if (tricksError) {
      fieldIssues.push({
        playerId: input.playerId,
        field: 'tricksWon',
        message: tricksError,
      });
    }
  }

  const fieldsValid = fieldIssues.length === 0;

  // Only sum the total when every tricks-won value parsed, otherwise the
  // sum would be misleading.
  let totalTricks = 0;
  if (fieldsValid) {
    totalTricks = inputs.reduce(
      (sum, input) => sum + (parseTricksWon(input.tricksWon) ?? 0),
      0,
    );
  }

  let totalIssue: string | null = null;
  if (fieldsValid && enforceTrickTotal && totalTricks !== expectedTrickTotal) {
    const diff = totalTricks - expectedTrickTotal;
    const direction = diff > 0 ? 'too many' : 'too few';
    totalIssue =
      `Tricks won must total ${expectedTrickTotal} — ` +
      `currently ${totalTricks} (${Math.abs(diff)} ${direction}).`;
  }

  const valid = fieldsValid && totalIssue === null;

  return { valid, fieldIssues, totalIssue, totalTricks, fieldsValid };
}

/**
 * Validates the four player names for match setup.
 * Returns a map of player id to error message.
 */
export function validatePlayerNames(
  names: { id: string; name: string }[],
): Record<string, string> {
  const issues: Record<string, string> = {};

  for (const player of names) {
    if (player.name.trim() === '') {
      issues[player.id] = 'Name is required';
    }
  }

  // Warn (not block) about duplicates — two players may legitimately share a
  // name, but it is usually a typo worth surfacing.
  const seen = new Map<string, string[]>();
  for (const player of names) {
    const key = player.name.trim().toLowerCase();
    if (key === '') continue;
    const list = seen.get(key) ?? [];
    list.push(player.id);
    seen.set(key, list);
  }
  for (const [, ids] of seen) {
    if (ids.length > 1) {
      for (const id of ids) {
        issues[id] = 'Duplicate player name';
      }
    }
  }

  return issues;
}

/**
 * Validates a target score: a positive whole number.
 */
export function validateTargetScore(raw: string): string | null {
  if (raw.trim() === '') return 'Target score is required';
  if (!/^\d+$/.test(raw.trim())) return 'Target score must be a whole number';
  const value = Number(raw.trim());
  if (!Number.isSafeInteger(value) || value <= 0) {
    return 'Target score must be a positive number';
  }
  return null;
}
