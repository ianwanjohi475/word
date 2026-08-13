/**
 * Design tokens — the single source of truth for Converta's visual language.
 *
 * Everything visual (color, spacing, radius, type, shadow, motion) is defined
 * here and consumed through the `useTheme()` hook so screens never hardcode a
 * hex value or a magic number. Spacing follows an 8px baseline grid.
 *
 * The palette is a clean, premium light theme built around a single deep-teal
 * accent — trustworthy and productive, in the spirit of modern service apps.
 */

export const palette = {
  // Brand accent — a confident deep teal. Used for primary actions, active
  // states and focus. One accent, applied consistently.
  accent: '#0E8C6B',
  accentPressed: '#0B6E54',
  accentDeep: '#0A5C49', // darker teal for banners / hero surfaces
  accentSoft: '#E4F3EE',
  accentSoftDark: '#12352C',

  // Neutrals (light)
  white: '#FFFFFF',
  neutral0: '#FFFFFF',
  neutral50: '#F6F8F9',
  neutral100: '#F0F2F4',
  neutral150: '#E8EBEE',
  neutral200: '#DEE2E7',
  neutral300: '#C6CCD3',
  neutral400: '#9AA2AC',
  neutral500: '#6B7480',
  neutral600: '#4E5763',
  neutral700: '#39404A',
  neutral800: '#252B33',
  neutral900: '#141A20',
  neutral950: '#0B1015',

  // Semantic
  success: '#12A66F',
  successSoft: '#E3F5EC',
  warning: '#E5942B',
  warningSoft: '#FBF0DF',
  danger: '#E4483D',
  dangerSoft: '#FCEBEA',
  info: '#2E76E8',
} as const;

/**
 * Per-format brand colors used for file-type icons and accents.
 */
export const formatColors = {
  word: { base: '#2B579A', soft: '#E8EFF9', on: '#FFFFFF' },
  excel: { base: '#1D7044', soft: '#E4F2EA', on: '#FFFFFF' },
  pdf: { base: '#D8362A', soft: '#FBE9E7', on: '#FFFFFF' },
  txt: { base: '#5B6472', soft: '#EDEFF3', on: '#FFFFFF' },
  image: { base: '#0E8C6B', soft: '#E4F3EE', on: '#FFFFFF' },
} as const;

/** Gradient pairs for premium hero/CTA surfaces. */
export const gradients = {
  brand: ['#15B488', '#0C7C63'] as const,
  brandDeep: ['#0F8C6B', '#0A5647'] as const,
  word: ['#3B6FC0', '#2B579A'] as const,
  excel: ['#27A866', '#1D7044'] as const,
  pdf: ['#EC5A4E', '#D8362A'] as const,
  txt: ['#828C9E', '#5B6472'] as const,
  violet: ['#7A5AF0', '#5B3EE0'] as const,
  amber: ['#F5A623', '#E5872B'] as const,
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -0.6 },
  h1: { fontSize: 27, lineHeight: 33, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 21, lineHeight: 27, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, lineHeight: 23, fontWeight: '700' as const, letterSpacing: -0.2 },
  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '700' as const, letterSpacing: 0.4 },
} as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 360,
} as const;

export type TypographyToken = keyof typeof typography;
export type FormatColorKey = keyof typeof formatColors;
