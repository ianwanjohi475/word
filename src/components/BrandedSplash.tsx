/** In-app launch screen — clean white background with a centered brand badge. */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import { Text } from './Text';

export function BrandedSplash({ onDone }: { onDone: () => void }) {
  const fade = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, speed: 10, bounciness: 9 }),
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: USE_NATIVE_DRIVER, easing: Easing.out(Easing.ease) }),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }).start(() => onDone());
    }, 1400);
    return () => clearTimeout(t);
  }, [fade, scale, opacity, onDone]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, { opacity: fade, pointerEvents: 'none' }]}>
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
        <View style={styles.badge}>
          <Svg width={44} height={44} viewBox="0 0 100 100">
            <Path
              d="M24 10 C24 6 27 4 30 4 L62 4 L84 26 L84 90 C84 94 81 96 78 96 L30 96 C27 96 24 94 24 90 Z"
              fill="#ffffff"
            />
            <Path d="M62 4 L84 26 L68 26 C65 26 62 24 62 22 Z" fill="rgba(255,255,255,0.55)" />
            <Rect x={36} y={46} width={34} height={7} rx={3.5} fill={palette.accent} />
            <Rect x={36} y={60} width={26} height={6} rx={3} fill="rgba(255,255,255,0.85)" />
            <Rect x={36} y={72} width={30} height={6} rx={3} fill="rgba(255,255,255,0.85)" />
          </Svg>
        </View>
        <Text variant="display" style={{ marginTop: 22, color: '#141A20' }}>
          Converta
        </Text>
        <Text variant="body" style={{ marginTop: 6, color: '#6B7480' }}>
          Word ⇆ PDF ⇆ Excel
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text variant="captionStrong" style={{ color: '#9AA2AC' }}>
          Proudly powered by ian_ke
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { position: 'absolute', bottom: 44, alignItems: 'center' },
});
