/**
 * Theme resolver — turns the raw tokens into a theme object exposed via
 * `useTheme()`. Semantic color names (bg, surface, text…) let screens stay
 * color-agnostic.
 *
 * The app is intentionally locked to a single, polished light theme so the brand
 * reads consistently on every device (no washed-out dark rendering).
 */
import { palette, spacing, radius, typography, motion, formatColors } from './tokens';

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  textInverse: string;
  accent: string;
  accentPressed: string;
  accentDeep: string;
  accentSoft: string;
  onAccent: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  skeleton: string;
  overlay: string;
};

const lightColors: ThemeColors = {
  bg: palette.neutral50,
  bgElevated: palette.white,
  surface: palette.white,
  surfaceAlt: palette.neutral100,
  surfaceSunken: palette.neutral100,
  border: palette.neutral150,
  borderStrong: palette.neutral200,
  text: palette.neutral900,
  textMuted: palette.neutral500,
  textFaint: palette.neutral400,
  textInverse: palette.white,
  accent: palette.accent,
  accentPressed: palette.accentPressed,
  accentDeep: palette.accentDeep,
  accentSoft: palette.accentSoft,
  onAccent: palette.white,
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.info,
  skeleton: palette.neutral150,
  overlay: 'rgba(11, 16, 21, 0.42)',
};

export type Shadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

function buildShadows() {
  const color = '#0B2A22';
  return {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    } as Shadow,
    sm: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    } as Shadow,
    md: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
    } as Shadow,
    lg: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 34,
      elevation: 12,
    } as Shadow,
  };
}

export type Theme = {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
  formatColors: typeof formatColors;
  shadows: ReturnType<typeof buildShadows>;
};

const shadows = buildShadows();

const THEME: Theme = {
  isDark: false,
  colors: lightColors,
  spacing,
  radius,
  typography,
  motion,
  formatColors,
  shadows,
};

export function useTheme(): Theme {
  return THEME;
}

export { palette, spacing, radius, typography, motion, formatColors };
