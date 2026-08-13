/** In-app launch screen — clean white background with a centered brand badge. */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import { Logo } from './Logo';
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
        <Logo size={92} radius={26} />
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
  footer: { position: 'absolute', bottom: 44, alignItems: 'center' },
});
