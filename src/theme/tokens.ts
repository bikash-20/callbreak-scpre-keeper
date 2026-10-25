/**
 * Design tokens.
 *
 * A "hybrid" visual system per the product brief:
 * - Dark charcoal-green surfaces for the match dashboard.
 * - Warm ivory surfaces for score entry and history.
 * - Muted gold reserved for the current leader.
 * - A restrained red for negative scores and destructive actions.
 *
 * Both themes expose identical token names so every component can switch
 * without conditionals.
 */

export interface TokenShape {
  // Brand greens
  forestDeep: string;
  forest: string;
  forestLight: string;
  forestMuted: string;

  // Accent
  gold: string;
  goldSoft: string;
  goldDeep: string;

  // Neutrals
  charcoal: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  inkInverse: string;

  // Surfaces
  pageBg: string;
  pageBgGradient: string;
  surfaceDark: string;
  surfaceDarkRaised: string;
  surfaceDarkBorder: string;
  surfaceLight: string;
  surfaceLightRaised: string;
  surfaceLightBorder: string;

  // Status
  positive: string;
  negative: string;
  negativeSoft: string;
  warning: string;
  warningSoft: string;
  info: string;

  // Effects
  focusRing: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
}

export const lightTokens: TokenShape = {
  forestDeep: '#0d261d',
  forest: '#15342a',
  forestLight: '#1d4a38',
  forestMuted: '#3f6b58',

  gold: '#a9801a',
  goldSoft: '#f0e3bd',
  goldDeep: '#7a5d0f',

  charcoal: '#1c1f1e',
  ink: '#1a1d1c',
  inkSoft: '#4a524e',
  inkMuted: '#78837e',
  inkInverse: '#f7f3e8',

  pageBg: '#f4f0e6',
  pageBgGradient:
    'radial-gradient(120% 90% at 50% -10%, #ffffff 0%, #f4f0e6 45%, #eae4d6 100%)',
  surfaceDark: '#15342a',
  surfaceDarkRaised: '#1d4235',
  surfaceDarkBorder: 'rgba(240, 227, 189, 0.16)',
  surfaceLight: '#fffdf8',
  surfaceLightRaised: '#ffffff',
  surfaceLightBorder: '#e2dccb',

  positive: '#1f7a4d',
  negative: '#b4472e',
  negativeSoft: '#f6e2dc',
  warning: '#9a6b0b',
  warningSoft: '#fbeed4',
  info: '#2b6a8f',

  focusRing: '#a9801a',
  shadowSm: '0 1px 2px rgba(21, 52, 42, 0.06)',
  shadowMd: '0 4px 16px rgba(21, 52, 42, 0.10)',
  shadowLg: '0 18px 48px rgba(13, 38, 29, 0.22)',
};

export const darkTokens: TokenShape = {
  forestDeep: '#0a1c15',
  forest: '#15342a',
  forestLight: '#1d4a38',
  forestMuted: '#4b7d67',

  gold: '#d9b64a',
  goldSoft: 'rgba(217, 182, 74, 0.16)',
  goldDeep: '#f0d689',

  charcoal: '#111413',
  ink: '#f2eee3',
  inkSoft: '#c2ccc7',
  inkMuted: '#8d9a95',
  inkInverse: '#12201a',

  pageBg: '#111413',
  pageBgGradient:
    'radial-gradient(120% 90% at 50% -10%, #1b2421 0%, #111413 50%, #0b0e0d 100%)',
  surfaceDark: '#15342a',
  surfaceDarkRaised: '#1d4235',
  surfaceDarkBorder: 'rgba(240, 227, 189, 0.16)',
  surfaceLight: '#1a1f1d',
  surfaceLightRaised: '#232927',
  surfaceLightBorder: '#313936',

  positive: '#5fc48c',
  negative: '#e8836a',
  negativeSoft: 'rgba(232, 131, 106, 0.14)',
  warning: '#e0b558',
  warningSoft: 'rgba(224, 181, 88, 0.14)',
  info: '#7fb8d8',

  focusRing: '#d9b64a',
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.45)',
  shadowLg: '0 18px 48px rgba(0, 0, 0, 0.55)',
};
