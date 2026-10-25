import { describe, expect, it } from 'vitest';
import {
  calculateRoundScore,
  formatScore,
  formatSignedScore,
  getScoringRule,
  pointsToUnits,
  SCORE_SCALE,
  STANDARD_RULE,
  unitsToPoints,
} from './scoring';

describe('calculateRoundScore — standard Callbreak scoring', () => {
  it('scores an exact bid as the bid itself', () => {
    // Bid 3, won 3 -> +3.0
    expect(calculateRoundScore(3, 3)).toBe(30);
    expect(formatScore(calculateRoundScore(3, 3))).toBe('3.0');
  });

  it('scores a bid met with overtricks as bid plus 0.1 per extra trick', () => {
    // Bid 3, won 5 -> +3.2
    expect(calculateRoundScore(3, 5)).toBe(32);
    expect(formatScore(calculateRoundScore(3, 5))).toBe('3.2');

    // Bid 4, won 6 -> +4.2
    expect(calculateRoundScore(4, 6)).toBe(42);
    expect(formatScore(calculateRoundScore(4, 6))).toBe('4.2');
  });

  it('scores a failed bid as negative the bid', () => {
    // Bid 4, won 2 -> -4.0
    expect(calculateRoundScore(4, 2)).toBe(-40);
    expect(formatScore(calculateRoundScore(4, 2))).toBe('-4.0');
  });

  it('treats missing the bid by exactly one trick as a failure', () => {
    expect(calculateRoundScore(5, 4)).toBe(-50);
  });

  it('scores zero tricks against a positive bid as a full loss', () => {
    expect(calculateRoundScore(13, 0)).toBe(-130);
  });

  it('produces a negative score whenever the bid is not met', () => {
    for (let bid = 1; bid <= 13; bid += 1) {
      for (let won = 0; won < bid; won += 1) {
        expect(calculateRoundScore(bid, won)).toBeLessThan(0);
      }
    }
  });

  it('is never negative once the bid is met', () => {
    for (let bid = 1; bid <= 13; bid += 1) {
      for (let won = bid; won <= 13; won += 1) {
        expect(calculateRoundScore(bid, won)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('matches the documented worked examples', () => {
    expect(formatScore(calculateRoundScore(4, 4))).toBe('4.0');
    expect(formatScore(calculateRoundScore(4, 6))).toBe('4.2');
    expect(formatScore(calculateRoundScore(4, 3))).toBe('-4.0');
    expect(formatScore(calculateRoundScore(2, 4))).toBe('2.2');
    expect(formatScore(calculateRoundScore(2, 5))).toBe('2.3');
    expect(formatScore(calculateRoundScore(3, 3))).toBe('3.0');
  });
});

describe('decimal accuracy', () => {
  it('stores every score as an exact integer number of tenths', () => {
    for (let bid = 1; bid <= 13; bid += 1) {
      for (let won = 0; won <= 13; won += 1) {
        const score = calculateRoundScore(bid, won);
        expect(Number.isInteger(score)).toBe(true);
      }
    }
  });

  it('avoids the float error that naive decimal maths would introduce', () => {
    // 0.1 + 0.2 !== 0.3 in floating point. Integer units must not drift.
    let total = 0;
    for (let i = 0; i < 10; i += 1) {
      total += calculateRoundScore(3, 5);
    }
    expect(total).toBe(320);
    expect(formatScore(total)).toBe('32.0');
  });

  it('keeps one decimal place for every representable score', () => {
    expect(formatScore(0)).toBe('0.0');
    expect(formatScore(5)).toBe('0.5');
    expect(formatScore(30)).toBe('3.0');
    expect(formatScore(32)).toBe('3.2');
    expect(formatScore(-40)).toBe('-4.0');
    expect(formatScore(-4)).toBe('-0.4');
  });

  it('never renders a negative zero', () => {
    expect(formatScore(-0)).toBe('0.0');
  });

  it('signs positive and negative scores explicitly', () => {
    expect(formatSignedScore(32)).toBe('+3.2');
    expect(formatSignedScore(-40)).toBe('-4.0');
    expect(formatSignedScore(0)).toBe('0.0');
  });

  it('converts between points and units losslessly', () => {
    expect(pointsToUnits(100)).toBe(1000);
    expect(unitsToPoints(1000)).toBe(100);
    expect(pointsToUnits(50)).toBe(500);
    expect(unitsToPoints(505)).toBe(50.5);
  });
});

describe('scoring mode registry', () => {
  it('exposes the standard rule under the standard id', () => {
    expect(getScoringRule('standard')).toBe(STANDARD_RULE);
    expect(STANDARD_RULE.scoreRound(3, 5)).toBe(32);
  });

  it('falls back to standard scoring for an unknown mode', () => {
    const unknown = 'house-rules' as unknown as 'standard';
    expect(getScoringRule(unknown)).toBe(STANDARD_RULE);
  });

  it('uses the same scale constant everywhere', () => {
    expect(SCORE_SCALE).toBe(10);
  });
});
