/** Rounded surface card, optionally pressable with a spring micro-interaction. */
import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  haptic?: boolean;
  disabled?: boolean;
}

export function Card({
  children,
  onPress,
  style,
  padded = true,
  elevation = 'sm',
  haptic = false,
  disabled,
}: Props) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const content = (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: padded ? theme.spacing.lg : 0,
          transform: [{ scale }],
        },
        theme.shadows[elevation],
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: USE_NATIVE_DRIVER, speed: 40, bounciness: 0 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, speed: 40, bounciness: 0 }).start()
      }
      onPress={() => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
    >
      {content}
    </Pressable>
  );
}

/** Non-animated plain surface (for static grouping). */
export function Surface({ children, style, padded = true }: Pick<Props, 'children' | 'style' | 'padded'>) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: padded ? theme.spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
