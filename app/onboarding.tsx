/** First-launch onboarding: 3 skippable slides, persists a completion flag. */
import React, { useRef, useState } from 'react';
import { View, FlatList, useWindowDimensions, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    title: 'Turn Any Document Into Editable Files',
    body: 'Snap or upload a document and Converta rebuilds it as a Word, Excel, PDF or text file you can actually edit.',
  },
  {
    key: 'scan',
    art: <ArtScan />,
    title: 'Smart OCR that understands layout',
    body: 'Advanced OCR reads your images and PDFs, preserving headings, paragraphs and tables — not just raw text.',
  },
  {
    key: 'edit',
    art: <ArtEdit />,
    title: 'Review, edit, and export anywhere',
    body: 'Fix any detail, tweak tables cell-by-cell, then download or share. Everything stays private on your device.',
  },
];

export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const complete = useSettingsStore((s) => s.completeOnboarding);

  const finish = () => {
    complete();
    router.replace('/(tabs)');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Pressable onPress={finish} hitSlop={10} style={{ opacity: index === SLIDES.length - 1 ? 0 : 1 }}>
          <Text variant="captionStrong" color="muted">
            Skip
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: theme.spacing.xxl }}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.xxl,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  marginBottom: theme.spacing.huge,
                }}
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
        )}
      />

      <View style={{ paddingHorizontal: theme.spacing.xxl, paddingBottom: insets.bottom + theme.spacing.xl }}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 3,
                backgroundColor: i === index ? theme.colors.accent : theme.colors.borderStrong,
              }}
            />
          ))}
        </View>
        <Button
          label={index === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={next}
          iconRight={index === SLIDES.length - 1 ? 'arrow-forward' : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { height: 44, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
});
