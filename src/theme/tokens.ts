/**
 * Design tokens.
 *
 * A "hybrid" visual system per the product brief:
 * - Deep navy surfaces (#171821 / #242532) for the match dashboard and dark mode.
 * - Soft lavender-tinted light surfaces (#F5F2FA) for score entry and history.
 * - Primary/deep lavender reserved for leader highlights and primary actions.
 * - A restrained red (#D94841) for invalid inputs, negative scores and
 *   destructive actions. Valid inputs stay neutral (default border).
 *
 * Both themes expose identical token names so every component can switch
 * without conditionals.
 */

export interface TokenShape {
  // Deep navy surfaces (dashboards, dark screens)
  forestDeep: string;
  forest: string;
  forestLight: string;
  forestMuted: string;

  // Lavender accents (leader, primary actions, focus highlights)
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
  // Dark navy dashboard surfaces (shared by both themes)
  forestDeep: '#171821',
  forest: '#242532',
  forestLight: '#2E2F3E',
  forestMuted: '#7C5CE7',

  // Deep lavender accent on light surfaces
  gold: '#7C5CE7',
  goldSoft: '#EBE4FA',
  goldDeep: '#5F45C9',

  // Neutral ramp for light surfaces
  charcoal: '#171821',
  ink: '#292637',
  inkSoft: '#4E4B5E',
  inkMuted: '#6F6B80',
  inkInverse: '#F8F7FC',

  pageBg: '#F5F2FA',
  pageBgGradient:
    'radial-gradient(120% 90% at 50% -10%, #ffffff 0%, #F5F2FA 45%, #EAE6F4 100%)',
  surfaceDark: '#171821',
  surfaceDarkRaised: '#242532',
  surfaceDarkBorder: '#414052',
  surfaceLight: '#FFFFFF',
  surfaceLightRaised: '#FFFFFF',
  surfaceLightBorder: '#D9D3C7',

  positive: '#7C5CE7',
  negative: '#D94841',
  negativeSoft: '#F9DED9',
  warning: '#9a6b0b',
  warningSoft: '#fbeed4',
  info: '#2b6a8f',

  focusRing: '#8B5CF6',
  shadowSm: '0 1px 2px rgba(23, 24, 33, 0.06)',
  shadowMd: '0 4px 16px rgba(23, 24, 33, 0.10)',
  shadowLg: '0 18px 48px rgba(23, 24, 33, 0.22)',
};

export const darkTokens: TokenShape = {
  forestDeep: '#171821',
  forest: '#1D1E2B',
  forestLight: '#2B2C3C',
  forestMuted: '#7C5CE7',

  // Primary lavender accent on dark surfaces
  gold: '#B8A5F8',
  goldSoft: 'rgba(184, 165, 248, 0.16)',
  goldDeep: '#CDBCFA',

  charcoal: '#171821',
  ink: '#F8F7FC',
  inkSoft: '#BBB8C9',
  inkMuted: '#827F94',
  inkInverse: '#292637',

  pageBg: '#171821',
  pageBgGradient:
    'radial-gradient(120% 90% at 50% -10%, #242532 0%, #171821 50%, #12131C 100%)',
  surfaceDark: '#171821',
  surfaceDarkRaised: '#242532',
  surfaceDarkBorder: '#414052',
  surfaceLight: '#242532',
  surfaceLightRaised: '#2B2C3C',
  surfaceLightBorder: '#414052',

  positive: '#B8A5F8',
  negative: '#EE7B74',
  negativeSoft: 'rgba(217, 72, 65, 0.18)',
  warning: '#e0b558',
  warningSoft: 'rgba(224, 181, 88, 0.14)',
  info: '#7fb8d8',

  focusRing: '#8B5CF6',
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.45)',
  shadowLg: '0 18px 48px rgba(0, 0, 0, 0.55)',
};
