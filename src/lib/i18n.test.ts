import { describe, expect, it } from 'vitest';
import {
  formatScoreValue,
  formatSignedScoreValue,
  translate,
  type Language,
} from './i18n';

describe('translation', () => {
  it('returns English copy unchanged for the default language', () => {
    expect(translate('New Match', 'en')).toBe('New Match');
  });

  it('translates known interface copy to Bengali', () => {
    expect(translate('New Match', 'bn')).toBe('নতুন ম্যাচ');
  });

  it('formats placeholders in Bengali without translating user-provided names', () => {
    expect(translate('Round {{number}} for {{name}}', 'bn', {
      number: 2,
      name: 'Bikash',
    })).toBe('রাউন্ড ২ — Bikash');
  });

  it('translates dynamic validation messages and preserves unknown text', () => {
    expect(translate('Bid must be between 1 and 13', 'bn')).toBe(
      'ডাকের সংখ্যা ১ থেকে ১৩-এর মধ্যে হতে হবে',
    );
    expect(translate('Custom player name', 'bn')).toBe('Custom player name');
  });

  it('supports the two explicit language choices', () => {
    const languages: Language[] = ['en', 'bn'];
    expect(languages).toEqual(['en', 'bn']);
  });

  it('formats scores with their sign in both languages', () => {
    expect(formatScoreValue(-40, 'en')).toBe('-4.0');
    expect(formatScoreValue(-40, 'bn')).toBe('-৪.০');
    expect(formatSignedScoreValue(32, 'bn')).toBe('+৩.২');
  });
});
