/** Shimmering skeleton placeholder for loading states. */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle, View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: Props) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.colors.skeleton, opacity },
        style,
      ]}
    />
  );
}

/** A skeleton shaped like a file row, used in Files/History loading states. */
export function FileRowSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        gap: theme.spacing.md,
      }}
    >
      <Skeleton width={44} height={52} radius={10} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={15} />
        <Skeleton width="45%" height={12} />
      </View>
    </View>
  );
}
