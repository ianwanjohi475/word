/** In-app animated launch screen shown briefly over the app on cold start. */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import { Text } from './Text';

export function BrandedSplash({ onDone }: { onDone: () => void }) {
  const fade = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, speed: 8, bounciness: 8 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: USE_NATIVE_DRIVER, easing: Easing.out(Easing.ease) }),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }).start(() => onDone());
    }, 1400);
    return () => clearTimeout(t);
  }, [fade, logoScale, logoOpacity, onDone]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, { opacity: fade, pointerEvents: 'none' }]}>
      <Animated.View style={{ alignItems: 'center', opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <View style={styles.logo}>
          <Svg width={54} height={54} viewBox="0 0 100 100">
            <Path
              d="M22 10 C22 6 25 4 28 4 L64 4 L84 26 L84 90 C84 94 81 96 78 96 L28 96 C25 96 22 94 22 90 Z"
              fill="#ffffff"
            />
            <Path d="M64 4 L84 26 L68 26 C65 26 64 24 64 22 Z" fill={palette.accentSoft} />
            <Rect x={34} y={44} width={38} height={7} rx={3.5} fill={palette.accent} />
            <Rect x={34} y={58} width={30} height={6} rx={3} fill={palette.neutral300} />
            <Rect x={34} y={70} width={34} height={6} rx={3} fill={palette.neutral300} />
          </Svg>
        </View>
        <Text variant="display" style={{ color: '#fff', marginTop: 20 }}>
          Converta
        </Text>
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
          Any document, editable in seconds
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text variant="captionStrong" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Proudly powered by ian_ke
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { position: 'absolute', bottom: 44, alignItems: 'center' },
});
