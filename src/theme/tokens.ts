/**
 * Design tokens — the single source of truth for Converta's visual language.
 *
 * Everything visual (color, spacing, radius, type, shadow, motion) is defined
 * here and consumed through the `useTheme()` hook so screens never hardcode a
 * hex value or a magic number. Spacing follows an 8px baseline grid.
 */

export const palette = {
  // Brand accent — a confident indigo/violet. Used sparingly for primary
  // actions, active states and focus. One accent, applied consistently.
  accent: '#5B5BF0',
  accentPressed: '#4A4AD6',
  accentSoft: '#EEEEFE',
  accentSoftDark: '#1E1E3A',

  // Neutrals (light)
  white: '#FFFFFF',
  neutral0: '#FFFFFF',
  neutral50: '#F7F8FA',
  neutral100: '#F1F3F6',
  neutral150: '#E7EAF0',
  neutral200: '#DCE0E8',
  neutral300: '#C3C9D4',
  neutral400: '#9BA3B2',
  neutral500: '#6B7385',
  neutral600: '#4E5566',
  neutral700: '#363C4A',
  neutral800: '#232834',
  neutral900: '#151922',
  neutral950: '#0B1120',

  // Semantic
  success: '#1EAE72',
  successSoft: '#E5F6EF',
  warning: '#E9A23B',
  warningSoft: '#FBF1E1',
  danger: '#E5484D',
  dangerSoft: '#FCECEC',
  info: '#3B82F6',
} as const;

/**
 * Per-format brand colors used for file-type icons and accents. These give the
 * app the "beautiful file-format icons" feel while staying inside the system.
 */
export const formatColors = {
  word: { base: '#2B579A', soft: '#E7EEF8', on: '#FFFFFF' },
  excel: { base: '#1D7044', soft: '#E4F2EA', on: '#FFFFFF' },
  pdf: { base: '#D8362A', soft: '#FBE9E7', on: '#FFFFFF' },
  txt: { base: '#5B6472', soft: '#EDEFF3', on: '#FFFFFF' },
  image: { base: '#7A5AF0', soft: '#EEEAFD', on: '#FFFFFF' },
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
  // A tight, modern type scale. Font families resolve to the system font by
  // default; the app loads Inter as the brand face at startup.
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  h2: { fontSize: 21, lineHeight: 27, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, lineHeight: 23, fontWeight: '600' as const, letterSpacing: -0.2 },
  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '600' as const, letterSpacing: 0.3 },
} as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 360,
} as const;

export type TypographyToken = keyof typeof typography;
export type FormatColorKey = keyof typeof formatColors;
