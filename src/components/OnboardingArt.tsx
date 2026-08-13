/**
 * Onboarding illustrations — smooth, custom-built animations (RN Animated +
 * gradients). Reliable on web and native, and designed to feel premium rather
 * than generic. Three variants power the three onboarding slides.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, gradients } from '@/theme';
import { USE_NATIVE_DRIVER } from '@/utils/platform';

const FRAME = 250;

function useFloat(delay = 0, distance = 9, duration = 1800) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay, duration]);
  return v.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
}

function Frame({ children }: { children: React.ReactNode }) {
  return <View style={styles.frame}>{children}</View>;
}

function DocCard() {
  const theme = useTheme();
  return (
    <View style={[styles.doc, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.md]}>
      <View style={[styles.docBar, { backgroundColor: theme.colors.accent, width: '55%' }]} />
      <View style={[styles.docLine, { backgroundColor: theme.colors.borderStrong, width: '80%' }]} />
      <View style={[styles.docLine, { backgroundColor: theme.colors.borderStrong, width: '70%' }]} />
      <View style={[styles.docLine, { backgroundColor: theme.colors.borderStrong, width: '84%' }]} />
      <View style={[styles.docChip, { backgroundColor: theme.colors.surfaceAlt }]} />
    </View>
  );
}

function Tile({
  colors,
  icon,
  style,
  delay,
}: {
  colors: readonly [string, string, ...string[]];
  icon: keyof typeof Ionicons.glyphMap;
  style: object;
  delay: number;
}) {
  const theme = useTheme();
  const translateY = useFloat(delay);
  return (
    <Animated.View style={[styles.tile, style, { transform: [{ translateY }] }, theme.shadows.md]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Ionicons name={icon} size={20} color="#fff" />
    </Animated.View>
  );
}

export function ArtTransform() {
  const rot = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER }));
    loop.start();
    return () => loop.stop();
  }, [rot]);
  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Frame>
      <Animated.View style={[styles.ring, { borderColor: theme.colors.accentSoft, transform: [{ rotate: spin }] }]}>
        <View style={[styles.ringDot, { backgroundColor: theme.colors.accent, top: -5, left: '50%', marginLeft: -5 }]} />
      </Animated.View>
      <DocCard />
      <Tile colors={gradients.word} icon="document-text" style={{ top: 18, left: 26 }} delay={0} />
      <Tile colors={gradients.excel} icon="grid" style={{ top: 30, right: 24 }} delay={300} />
      <Tile colors={gradients.pdf} icon="document" style={{ bottom: 26, right: 34 }} delay={600} />
    </Frame>
  );
}

export function ArtScan() {
  const theme = useTheme();
  const cards: { colors: readonly [string, string, ...string[]]; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { colors: gradients.word, label: 'DOCX', icon: 'document-text' },
    { colors: gradients.pdf, label: 'PDF', icon: 'document' },
    { colors: gradients.excel, label: 'XLSX', icon: 'grid' },
  ];
  return (
    <Frame>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {cards.map((c, i) => (
          <FanCard key={c.label} colors={c.colors} icon={c.icon} label={c.label} delay={i * 220} />
        ))}
      </View>
      <View style={[styles.swapBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.md]}>
        <Ionicons name="swap-horizontal" size={22} color={theme.colors.accent} />
      </View>
    </Frame>
  );
}

function FanCard({ colors, icon, label, delay }: { colors: readonly [string, string, ...string[]]; icon: keyof typeof Ionicons.glyphMap; label: string; delay: number }) {
  const translateY = useFloat(delay, 10, 2000);
  return (
    <Animated.View style={[styles.fanCard, { transform: [{ translateY }] }]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fanInner}>
        <Ionicons name={icon} size={26} color="#fff" />
      </LinearGradient>
    </Animated.View>
  );
}

export function ArtEdit() {
  const theme = useTheme();
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);
  const penX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-70, 70] });
  return (
    <Frame>
      <View style={[styles.editPage, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.md]}>
        <View style={[styles.editHeader, { backgroundColor: theme.colors.accentSoft }]} />
        {[0, 1, 2].map((r) => (
          <View key={r} style={styles.editRow}>
            <View style={[styles.editCell, { backgroundColor: theme.colors.surfaceAlt }]} />
            <View style={[styles.editCell, { backgroundColor: theme.colors.surfaceAlt }]} />
            <View style={[styles.editCell, { backgroundColor: theme.colors.surfaceAlt }]} />
          </View>
        ))}
      </View>
      <Animated.View style={[styles.pen, { transform: [{ translateX: penX }] }]}>
        <LinearGradient colors={gradients.violet} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.penInner}>
          <Ionicons name="create" size={18} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  frame: { height: FRAME, alignItems: 'center', justifyContent: 'center' },
  doc: { width: 118, height: 150, borderRadius: 18, borderWidth: 1, padding: 16, justifyContent: 'flex-start' },
  docBar: { height: 12, borderRadius: 6, marginBottom: 14 },
  docLine: { height: 7, borderRadius: 4, marginBottom: 8 },
  docChip: { height: 34, borderRadius: 8, marginTop: 6 },
  tile: { position: 'absolute', width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: { position: 'absolute', width: 210, height: 210, borderRadius: 110, borderWidth: 2, borderStyle: 'dashed' },
  ringDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  swapBadge: { position: 'absolute', width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center', bottom: 40 },
  fanCard: { borderRadius: 20 },
  fanInner: { width: 66, height: 84, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  editPage: { width: 170, height: 150, borderRadius: 16, borderWidth: 1, padding: 14 },
  editHeader: { height: 22, borderRadius: 6, marginBottom: 10 },
  editRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  editCell: { flex: 1, height: 20, borderRadius: 5 },
  pen: { position: 'absolute', bottom: 44 },
  penInner: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
