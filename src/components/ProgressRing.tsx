/** Circular progress ring with an animated arc and a centered percentage.
 *
 * The arc is driven by React state (not an animated SVG prop) so it behaves
 * identically on web and native and avoids react-native-svg forwarding
 * non-DOM props like `collapsable` to the browser. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  stroke?: number;
  label?: string;
}

export function ProgressRing({ progress, size = 168, stroke = 12, label }: Props) {
  const theme = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(0)).current;
  const [value, setValue] = useState(0); // 0..1, smoothed

  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    Animated.timing(anim, { toValue: target, duration: 500, useNativeDriver: false }).start();
    const id = anim.addListener(({ value: v }) => setValue(v));
    return () => anim.removeListener(id);
  }, [progress, anim]);

  const offset = circumference * (1 - value);
  const pct = Math.round(value * 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </Svg>
      <Text variant="display">{pct}%</Text>
      {!!label && (
        <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
          {label}
        </Text>
      )}
    </View>
  );
}
