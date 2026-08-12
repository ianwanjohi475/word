/**
 * Theme resolver — light + dark palettes exposed via `useTheme()`.
 *
 * The active mode comes from Settings (system / light / dark). `useTheme()`
 * reads the settings store and the OS scheme, so toggling the mode re-renders
 * every screen instantly.
 */
import { Platform, useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
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

const darkColors: ThemeColors = {
  bg: '#0B1015',
  bgElevated: '#141A20',
  surface: '#141A20',
  surfaceAlt: '#1E262E',
  surfaceSunken: '#0E141A',
  border: '#232C34',
  borderStrong: '#313C46',
  text: '#F2F5F7',
  textMuted: '#9AA6B2',
  textFaint: '#6B7681',
  textInverse: '#0B1015',
  accent: '#1BA67F',
  accentPressed: '#159470',
  accentDeep: '#0C5C49',
  accentSoft: '#12352C',
  onAccent: '#FFFFFF',
  success: '#2FBE82',
  successSoft: '#12271F',
  warning: '#F0B25A',
  warningSoft: '#2A2113',
  danger: '#F0666B',
  dangerSoft: '#2A1618',
  info: '#5C97F7',
  skeleton: '#222C34',
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
  const color = isDark ? '#000000' : '#0B2A22';
  // On web, RNW deprecates the shadow* props — use CSS boxShadow so the browser
  // console stays clean.
  if (Platform.OS === 'web') {
    const a = isDark ? 0.5 : 1;
    return {
      none: {} as Shadow,
      sm: { boxShadow: `0 2px 6px rgba(3,10,8,${0.06 * a})` } as unknown as Shadow,
      md: { boxShadow: `0 8px 20px rgba(3,10,8,${0.1 * a})` } as unknown as Shadow,
      lg: { boxShadow: `0 16px 34px rgba(3,10,8,${0.16 * a})` } as unknown as Shadow,
    };
  }
  const opa = (base: number) => (isDark ? Math.min(1, base * 4) : base);
  return {
    none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 } as Shadow,
    sm: { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: opa(0.06), shadowRadius: 6, elevation: 2 } as Shadow,
    md: { shadowColor: color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: opa(0.1), shadowRadius: 20, elevation: 5 } as Shadow,
    lg: { shadowColor: color, shadowOffset: { width: 0, height: 16 }, shadowOpacity: opa(0.16), shadowRadius: 34, elevation: 12 } as Shadow,
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

const lightShadows = buildShadows(false);
const darkShadows = buildShadows(true);

const lightTheme: Theme = {
  isDark: false,
  colors: lightColors,
  spacing,
  radius,
  typography,
  motion,
  formatColors,
  shadows: lightShadows,
};

const darkTheme: Theme = {
  isDark: true,
  colors: darkColors,
  spacing,
  radius,
  typography,
  motion,
  formatColors,
  shadows: darkShadows,
};

export function useTheme(): Theme {
  const mode = useSettingsStore((s) => s.themeMode);
  const scheme = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && scheme === 'dark');
  return isDark ? darkTheme : lightTheme;
}

export { palette, spacing, radius, typography, motion, formatColors };
