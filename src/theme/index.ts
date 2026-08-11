/**
 * Theme resolver — turns the raw tokens into a light/dark theme object and
 * exposes it via `useTheme()`. Semantic color names (bg, surface, text…) let
 * screens stay theme-agnostic.
 */
import { useColorScheme } from 'react-native';
import { palette, spacing, radius, typography, motion, formatColors, motion as _m } from './tokens';

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
  overlay: 'rgba(11, 17, 32, 0.45)',
};

const darkColors: ThemeColors = {
  bg: palette.neutral950,
  bgElevated: palette.neutral900,
  surface: palette.neutral900,
  surfaceAlt: palette.neutral800,
  surfaceSunken: '#10151F',
  border: '#242B39',
  borderStrong: '#313A4B',
  text: '#F3F5F9',
  textMuted: '#9AA3B5',
  textFaint: '#6B7385',
  textInverse: palette.neutral950,
  accent: '#7B7BF5',
  accentPressed: '#6A6AEE',
  accentSoft: palette.accentSoftDark,
  onAccent: palette.white,
  success: '#2FBE82',
  successSoft: '#12271F',
  warning: '#F0B25A',
  warningSoft: '#2A2113',
  danger: '#F0666B',
  dangerSoft: '#2A1618',
  info: '#5C97F7',
  skeleton: '#222A38',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export type Shadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

function buildShadows(isDark: boolean) {
  const color = isDark ? '#000000' : '#0B1120';
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
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.4 : 0.06,
      shadowRadius: 3,
      elevation: 1,
    } as Shadow,
    md: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.5 : 0.09,
      shadowRadius: 16,
      elevation: 4,
    } as Shadow,
    lg: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: isDark ? 0.55 : 0.14,
      shadowRadius: 30,
      elevation: 10,
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

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    motion,
    formatColors,
    shadows: buildShadows(isDark),
  };
}

export { palette, spacing, radius, typography, motion, formatColors };
