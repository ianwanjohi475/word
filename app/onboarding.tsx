/** First-launch onboarding: 3 skippable slides. Controlled carousel so the
 * primary button works identically on web and native (no reliance on momentum
 * scroll events, which don't fire with a mouse). */
import React, { useRef, useState } from 'react';
import { View, ScrollView, useWindowDimensions, Pressable, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { ArtTransform, ArtScan, ArtEdit } from '@/components/OnboardingArt';
import { useSettingsStore } from '@/store/useSettingsStore';

interface Slide {
  key: string;
  art: React.ReactNode;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'transform',
    art: <ArtTransform />,
    title: 'Turn any document into editable files',
    body: 'Snap or upload a document and Converta rebuilds it as a Word, Excel, PDF or text file you can actually edit.',
  },
  {
    key: 'scan',
    art: <ArtScan />,
    title: 'Smart OCR that understands layout',
    body: 'Advanced AI reads your images and PDFs, keeping headings, paragraphs and tables intact — not just raw text.',
  },
  {
    key: 'edit',
    art: <ArtEdit />,
    title: 'Review, edit and export anywhere',
    body: 'Fix any detail, tweak tables cell by cell, then download or share. Everything stays private on your device.',
  },
];

export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const complete = useSettingsStore((s) => s.completeOnboarding);

  const finish = () => {
    complete();
    router.replace('/(tabs)');
  };

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  const next = () => {
    if (index < SLIDES.length - 1) goTo(index + 1);
    else finish();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.brandDot, { backgroundColor: theme.colors.accent }]} />
          <Text variant="bodyStrong">Converta</Text>
        </View>
        <Pressable onPress={finish} hitSlop={10} style={{ opacity: isLast ? 0 : 1 }} disabled={isLast}>
          <Text variant="captionStrong" color="muted">
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((item) => (
          <View key={item.key} style={{ width, paddingHorizontal: theme.spacing.xxl }}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View
                style={[
                  styles.artCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  theme.shadows.md,
                ]}
              >
                {item.art}
              </View>
              <Text variant="h1" style={{ marginBottom: theme.spacing.md }}>
                {item.title}
              </Text>
              <Text variant="bodyLg" color="muted">
                {item.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: theme.spacing.xxl, paddingBottom: insets.bottom + theme.spacing.xl }}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <Pressable key={s.key} onPress={() => goTo(i)} hitSlop={8}>
              <View
                style={{
                  width: i === index ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 3,
                  backgroundColor: i === index ? theme.colors.accent : theme.colors.borderStrong,
                }}
              />
            </Pressable>
          ))}
        </View>
        <Button
          label={isLast ? 'Get Started' : 'Continue'}
          onPress={next}
          iconRight={isLast ? 'arrow-forward' : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandDot: { width: 20, height: 20, borderRadius: 7 },
  artCard: {
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 40,
    paddingVertical: 8,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
});
