/**
 * Versioned local data model.
 *
 * Design notes:
 * - `roundScore` is stored as an integer number of *tenths of a point*.
 *   3.2 points is `32`. Integer units eliminate floating-point drift
 *   entirely (e.g. 0.1 + 0.2 !== 0.3 in floats).
 * - Cumulative scores and rankings are NEVER persisted. They are always
 *   derived from the saved round records so they can never drift out of
 *   sync with the underlying entries. See `src/lib/derive.ts`.
 */

export const SCHEMA_VERSION = 2;

/** Number of players in a match. Fixed at four by the rules of the game. */
export const PLAYER_COUNT = 4;

/** Default number of tricks distributed across all players in one round. */
export const DEFAULT_TRICK_TOTAL = 13;

/** Lowest legal bid. */
export const MIN_BID = 1;

/** Highest legal bid — you cannot call more tricks than exist. */
export const MAX_BID = 13;

/** Lowest legal tricks-won count. */
export const MIN_TRICKS = 0;

/** Highest legal tricks-won count. */
export const MAX_TRICKS = 13;

export type MatchStatus = 'active' | 'completed';

/**
 * Scoring modes are keyed by a registry in `src/lib/scoring.ts` so new
 * modes can be added without touching the UI or the data model.
 */
export type ScoringMode = 'standard';

export interface Player {
  id: string;
  name: string;
  /** Fixed seat position (0-3). Stable for the lifetime of the match. */
  seatIndex: number;
}

export interface PlayerRoundEntry {
  playerId: string;
  /** Tricks called by the player. Integer, 1-13. */
  bid: number;
  /** Tricks actually won by the player. Integer, 0-13. */
  tricksWon: number;
  /** Points earned this round, in tenths of a point. */
  roundScore: number;
}

export interface Round {
  id: string;
  /** 1-based, contiguous. */
  roundNumber: number;
  playerEntries: PlayerRoundEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  name: string;
  players: Player[];
  /** Winning score in whole points (e.g. 100). */
  targetScore: number;
  scoringMode: ScoringMode;
  status: MatchStatus;
  rounds: Round[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  schemaVersion: number;
  /** When true, a round's tricks-won values must sum to `expectedTrickTotal`. */
  enforceTrickTotal: boolean;
  /** Expected total tricks per round. Defaults to 13. */
  expectedTrickTotal: number;
}

export interface WinnerResult {
  /** Players tied for the highest qualifying score. More than one means a tie. */
  winnerIds: string[];
  isTie: boolean;
  /** The winning score, in tenths of a point. */
  topScore: number;
}

export interface Ranking {
  playerId: string;
  /** Cumulative score in tenths of a point. */
  score: number;
  /** 1-based. Players on equal scores share a rank (1, 1, 3). */
  rank: number;
}

/** A round plus the cumulative scores standing immediately after it. */
export interface RoundSummary {
  round: Round;
  /** Cumulative score after this round, keyed by player id, in tenths. */
  cumulativeAfter: Record<string, number>;
}
