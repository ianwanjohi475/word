/** First-launch onboarding — premium, animated, shown once (persisted flag). */
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, useWindowDimensions, Pressable, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
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
    title: 'Convert documents in seconds',
    body: 'Turn Word into PDF, PDF into Word, Excel into a table and back — instantly, on your device.',
  },
  {
    key: 'formats',
    art: <ArtScan />,
    title: 'Word · PDF · Excel',
    body: 'Your headings, paragraphs and tables stay intact across every format. No account, no limits.',
  },
  {
    key: 'edit',
    art: <ArtEdit />,
    title: 'Review, edit and export',
    body: 'Fix the extracted text, tweak tables cell by cell, then download or share in any format.',
  },
];

export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const complete = useSettingsStore((s) => s.completeOnboarding);

  // Belt-and-suspenders: never show onboarding to a user who finished it once.
  useEffect(() => {
    if (onboardingComplete) router.replace('/(tabs)');
  }, [onboardingComplete, router]);

  const finish = () => {
    complete();
    router.replace('/(tabs)');
  };

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  const next = () => (index < SLIDES.length - 1 ? goTo(index + 1) : finish());

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Logo size={30} radius={9} />
          <Text variant="bodyStrong" style={{ marginLeft: 8 }}>
            Converta
          </Text>
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
          <View key={item.key} style={{ width, paddingHorizontal: theme.spacing.xl }}>
            <LinearGradient
              colors={[theme.colors.accentSoft, theme.colors.surface] as [string, string]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={[styles.panel, { borderColor: theme.colors.border }]}
            >
              {item.art}
            </LinearGradient>
            <Text variant="display" style={{ marginTop: theme.spacing.xxl }}>
              {item.title}
            </Text>
            <Text variant="bodyLg" color="muted" style={{ marginTop: theme.spacing.md }}>
              {item.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: insets.bottom + theme.spacing.xl }}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <Pressable key={s.key} onPress={() => goTo(i)} hitSlop={8}>
              <View
                style={{
                  width: i === index ? 26 : 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 3,
                  backgroundColor: i === index ? theme.colors.accent : theme.colors.borderStrong,
                }}
              />
            </Pressable>
          ))}
        </View>
        <Button label={isLast ? 'Get Started' : 'Continue'} onPress={next} gradient iconRight={isLast ? 'arrow-forward' : undefined} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
});
