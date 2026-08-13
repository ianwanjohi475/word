/** Premium tool tile: a gradient icon chip + title/subtitle in a soft card. */
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import { Text } from './Text';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  colors: readonly [string, string, ...string[]];
  onPress: () => void;
}

export function ToolTile({ icon, title, subtitle, colors, onPress }: Props) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: USE_NATIVE_DRIVER, speed: 40, bounciness: 0 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Pressable
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        style={[
          styles.tile,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          theme.shadows.sm,
        ]}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
          <Ionicons name={icon} size={22} color="#fff" />
        </LinearGradient>
        <Text variant="bodyStrong" numberOfLines={1} style={{ marginTop: 12 }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text variant="caption" color="muted" numberOfLines={1} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
        <View style={[styles.arrow, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Ionicons name="arrow-forward" size={13} color={theme.colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 128,
  },
  chip: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
