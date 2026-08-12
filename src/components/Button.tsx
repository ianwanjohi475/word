/** Primary/secondary/ghost/danger button with press + haptic micro-interaction. */
import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth = true,
  haptic = true,
  style,
}: Props) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  const heights: Record<Size, number> = { lg: 54, md: 46, sm: 38 };
  const paddings: Record<Size, number> = { lg: theme.spacing.xl, md: theme.spacing.lg, sm: theme.spacing.md };
  const textVariant = size === 'sm' ? 'captionStrong' : 'bodyStrong';

  const bg: Record<Variant, string> = {
    primary: theme.colors.accent,
    secondary: theme.colors.surfaceAlt,
    ghost: 'transparent',
    danger: theme.colors.danger,
  };
  const fg: Record<Variant, 'onAccent' | 'text' | 'accent'> = {
    primary: 'onAccent',
    secondary: 'text',
    ghost: 'accent',
    danger: 'onAccent',
  };

  const animateTo = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: USE_NATIVE_DRIVER, speed: 40, bounciness: 0 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.full, style]}>
      <Pressable
        disabled={isDisabled}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        onPress={() => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress?.();
        }}
        android_ripple={
          variant === 'ghost' ? undefined : { color: 'rgba(255,255,255,0.14)', borderless: false }
        }
        style={[
          styles.base,
          {
            height: heights[size],
            paddingHorizontal: paddings[size],
            backgroundColor: bg[variant],
            borderRadius: theme.radius.md,
            opacity: isDisabled ? 0.55 : 1,
            borderWidth: variant === 'secondary' ? 1 : 0,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : theme.colors.accent} />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={size === 'sm' ? 16 : 19}
                color={
                  fg[variant] === 'onAccent'
                    ? theme.colors.onAccent
                    : fg[variant] === 'accent'
                      ? theme.colors.accent
                      : theme.colors.text
                }
                style={styles.iconLeft}
              />
            )}
            <Text variant={textVariant} color={fg[variant]}>
              {label}
            </Text>
            {iconRight && (
              <Ionicons
                name={iconRight}
                size={size === 'sm' ? 16 : 19}
                color={
                  fg[variant] === 'onAccent'
                    ? theme.colors.onAccent
                    : fg[variant] === 'accent'
                      ? theme.colors.accent
                      : theme.colors.text
                }
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
