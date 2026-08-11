/** Typed text primitive bound to the typography tokens + theme colors. */
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import type { TypographyToken } from '@/theme/tokens';

type Color = 'text' | 'muted' | 'faint' | 'accent' | 'inverse' | 'danger' | 'success' | 'onAccent';

interface Props extends TextProps {
  variant?: TypographyToken;
  color?: Color;
  center?: boolean;
  weight?: '400' | '500' | '600' | '700';
}

export function Text({
  variant = 'body',
  color = 'text',
  center,
  weight,
  style,
  children,
  ...rest
}: Props) {
  const theme = useTheme();
  const t = theme.typography[variant];
  const colorMap: Record<Color, string> = {
    text: theme.colors.text,
    muted: theme.colors.textMuted,
    faint: theme.colors.textFaint,
    accent: theme.colors.accent,
    inverse: theme.colors.textInverse,
    danger: theme.colors.danger,
    success: theme.colors.success,
    onAccent: theme.colors.onAccent,
  };
  return (
    <RNText
      style={[
        t,
        { color: colorMap[color] },
        center && styles.center,
        weight ? { fontWeight: weight } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
