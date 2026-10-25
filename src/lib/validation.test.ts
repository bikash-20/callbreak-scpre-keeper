import { describe, expect, it } from 'vitest';
import {
  validateBid,
  validatePlayerNames,
  validateRound,
  validateTargetScore,
  validateTricksWon,
  type PlayerInput,
} from './validation';

function entry(
  playerId: string,
  bid: string,
  tricksWon: string,
): PlayerInput {
  return { playerId, playerName: playerId, bid, tricksWon };
}

const VALID_ROUND: PlayerInput[] = [
  entry('p1', '3', '4'),
  entry('p2', '4', '2'),
  entry('p3', '2', '3'),
  entry('p4', '5', '4'),
];

describe('validateBid', () => {
  it('accepts bids from 1 to 13', () => {
    for (let bid = 1; bid <= 13; bid += 1) {
      expect(validateBid(String(bid))).toBeNull();
    }
  });

  it('rejects a bid below 1', () => {
    expect(validateBid('0')).toBe('Bid must be between 1 and 13');
  });

  it('rejects a bid above 13', () => {
    expect(validateBid('14')).toBe('Bid must be between 1 and 13');
  });

  it('rejects a missing bid', () => {
    expect(validateBid('')).toBe('Bid is required');
    expect(validateBid('   ')).toBe('Bid is required');
  });

  it('rejects a non-integer bid', () => {
    expect(validateBid('3.5')).toBe('Bid must be a whole number');
    expect(validateBid('abc')).toBe('Bid must be a whole number');
    expect(validateBid('-2')).toBe('Bid must be a whole number');
  });
});

describe('validateTricksWon', () => {
  it('accepts tricks from 0 to 13', () => {
    for (let tricks = 0; tricks <= 13; tricks += 1) {
      expect(validateTricksWon(String(tricks))).toBeNull();
    }
  });

  it('rejects tricks above 13', () => {
    expect(validateTricksWon('14')).toBe('Tricks won must be between 0 and 13');
  });

  it('rejects negative tricks', () => {
    expect(validateTricksWon('-1')).toBe('Tricks won must be a whole number');
  });

  it('rejects a missing tricks-won value', () => {
    expect(validateTricksWon('')).toBe('Tricks won is required');
  });
});

describe('validateRound — total tricks', () => {
  it('accepts a valid total of thirteen', () => {
    const result = validateRound(VALID_ROUND);
    expect(result.valid).toBe(true);
    expect(result.totalTricks).toBe(13);
    expect(result.totalIssue).toBeNull();
    expect(result.fieldIssues).toHaveLength(0);
  });

  it('rejects a total below thirteen', () => {
    const result = validateRound([
      entry('p1', '3', '4'),
      entry('p2', '4', '2'),
      entry('p3', '2', '3'),
      entry('p4', '5', '3'),
    ]);
    expect(result.valid).toBe(false);
    expect(result.totalTricks).toBe(12);
    expect(result.totalIssue).toContain('must total 13');
    expect(result.totalIssue).toContain('currently 12');
    expect(result.totalIssue).toContain('too few');
  });

  it('rejects a total above thirteen', () => {
    const result = validateRound([
      entry('p1', '3', '4'),
      entry('p2', '4', '2'),
      entry('p3', '2', '3'),
      entry('p4', '5', '5'),
    ]);
    expect(result.valid).toBe(false);
    expect(result.totalTricks).toBe(14);
    expect(result.totalIssue).toContain('currently 14');
    expect(result.totalIssue).toContain('too many');
  });

  it('honours an overridden expected trick total', () => {
    const round: PlayerInput[] = [
      entry('p1', '3', '4'),
      entry('p2', '4', '2'),
      entry('p3', '2', '3'),
      entry('p4', '5', '3'),
    ];
    const result = validateRound(round, { expectedTrickTotal: 12 });
    expect(result.valid).toBe(true);
    expect(result.totalTricks).toBe(12);
  });

  it('skips the total check when enforcement is disabled', () => {
    const round: PlayerInput[] = [
      entry('p1', '3', '4'),
      entry('p2', '4', '2'),
      entry('p3', '2', '3'),
      entry('p4', '5', '3'),
    ];
    const result = validateRound(round, { enforceTrickTotal: false });
    expect(result.valid).toBe(true);
    expect(result.totalTricks).toBe(12);
    expect(result.totalIssue).toBeNull();
  });
});

describe('validateRound — field errors', () => {
  it('reports every invalid field with its player and field', () => {
    const result = validateRound([
      entry('p1', '0', '4'),
      entry('p2', '4', '99'),
      entry('p3', '', '3'),
      entry('p4', '5', '3'),
    ]);
    expect(result.valid).toBe(false);
    expect(result.fieldsValid).toBe(false);
    expect(result.fieldIssues).toHaveLength(3);
    expect(result.fieldIssues[0]).toEqual({
      playerId: 'p1',
      field: 'bid',
      message: 'Bid must be between 1 and 13',
    });
    expect(result.fieldIssues[1]?.field).toBe('tricksWon');
    expect(result.fieldIssues[2]?.field).toBe('bid');
  });

  it('does not report a misleading total when a field failed to parse', () => {
    const result = validateRound([
      entry('p1', '3', '4'),
      entry('p2', '4', 'x'),
      entry('p3', '2', '3'),
      entry('p4', '5', '3'),
    ]);
    expect(result.totalIssue).toBeNull();
    expect(result.totalTricks).toBe(0);
    expect(result.valid).toBe(false);
  });

  it('does not silently modify the user inputs', () => {
    const inputs = [
      entry('p1', '3', '4'),
      entry('p2', '4', '2'),
      entry('p3', '2', '3'),
      entry('p4', '5', '3'),
    ];
    const snapshot = JSON.stringify(inputs);
    validateRound(inputs);
    expect(JSON.stringify(inputs)).toBe(snapshot);
  });
});

describe('validatePlayerNames', () => {
  it('accepts four distinct names', () => {
    const issues = validatePlayerNames([
      { id: 'p1', name: 'Joy' },
      { id: 'p2', name: 'Bikash' },
      { id: 'p3', name: 'Plabon' },
      { id: 'p4', name: 'Sumon' },
    ]);
    expect(issues).toEqual({});
  });

  it('rejects an empty name', () => {
    const issues = validatePlayerNames([
      { id: 'p1', name: 'Joy' },
      { id: 'p2', name: '  ' },
      { id: 'p3', name: 'Plabon' },
      { id: 'p4', name: 'Sumon' },
    ]);
    expect(issues.p2).toBe('Name is required');
  });

  it('warns about duplicate names', () => {
    const issues = validatePlayerNames([
      { id: 'p1', name: 'Joy' },
      { id: 'p2', name: 'joy' },
      { id: 'p3', name: 'Plabon' },
      { id: 'p4', name: 'Sumon' },
    ]);
    expect(issues.p1).toBe('Duplicate player name');
    expect(issues.p2).toBe('Duplicate player name');
    expect(issues.p3).toBeUndefined();
  });
});

describe('validateTargetScore', () => {
  it('accepts a positive whole number', () => {
    expect(validateTargetScore('50')).toBeNull();
    expect(validateTargetScore('100')).toBeNull();
    expect(validateTargetScore('1')).toBeNull();
  });

  it('rejects an empty target', () => {
    expect(validateTargetScore('')).toBe('Target score is required');
  });

  it('rejects zero and negative targets', () => {
    expect(validateTargetScore('0')).toBe('Target score must be a positive number');
    expect(validateTargetScore('-5')).toBe('Target score must be a whole number');
  });

  it('rejects a fractional target', () => {
    expect(validateTargetScore('12.5')).toBe('Target score must be a whole number');
  });
});
