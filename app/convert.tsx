/** Conversion Selection: preview the source, pick an output format, then convert. */
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormatIcon, SourceGlyph } from '@/components/FormatIcon';
import { useConversionStore } from '@/store/useConversionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { startOcr, subscribeOcr, type JobStatus } from '@/services/ocrController';
import { OUTPUT_FORMATS, FORMAT_META, sourceFormatLabel } from '@/utils/formats';
import { formatBytes } from '@/utils/format';
import type { OutputFormat } from '@/types';

export default function Convert() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ target?: OutputFormat }>();

  const assets = useConversionStore((s) => s.assets);
  const activeIndex = useConversionStore((s) => s.activeIndex);
  const setActiveIndex = useConversionStore((s) => s.setActiveIndex);
  const selectedFormat = useConversionStore((s) => s.selectedFormat);
  const setSelectedFormat = useConversionStore((s) => s.setSelectedFormat);
  const defaultFormat = useSettingsStore((s) => s.defaultFormat);

  const active = assets[activeIndex] ?? assets[0];
  const [ocrStatus, setOcrStatus] = useState<JobStatus>('running');
  const [hasTables, setHasTables] = useState(false);
  const [manual, setManual] = useState(false);

  // Initialize the chosen format from param / default once.
  useEffect(() => {
    if (!selectedFormat) setSelectedFormat(params.target ?? defaultFormat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kick off OCR for the active asset and watch for table detection.
  useEffect(() => {
    if (!active) return;
    startOcr(active);
    const unsub = subscribeOcr((job) => {
      if (job.assetId !== active.id) return;
      setOcrStatus(job.status);
      if (job.status === 'done' && job.doc) setHasTables(job.doc.hasTables);
    });
    return unsub;
  }, [active]);

  // When tables are detected and the user hasn't manually chosen, suggest Excel.
  useEffect(() => {
    if (hasTables && !manual && !params.target) setSelectedFormat('excel');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTables]);

  const chosen = selectedFormat ?? defaultFormat;

  const info = useMemo(() => {
    if (!active) return '';
    return `${sourceFormatLabel(active.sourceFormat)} document · ${formatBytes(active.size)}`;
  }, [active]);

  if (!active) {
    return (
      <Screen header={{ title: 'Convert', showBack: true }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text variant="body" color="muted">
            No file selected.
          </Text>
          <View style={{ height: 12 }} />
          <Button label="Choose a file" onPress={() => router.replace('/upload')} fullWidth={false} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={{ title: 'Convert', showBack: true }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Source preview */}
        <Card padded elevation="sm">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={[
                styles.thumb,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
              ]}
            >
              {active.previewUri ? (
                <Image source={{ uri: active.previewUri }} style={styles.thumbImg} contentFit="cover" transition={150} />
              ) : (
                <SourceGlyph format={active.sourceFormat} size={34} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: theme.spacing.lg }}>
              <Text variant="bodyStrong" numberOfLines={2}>
                {active.name}
              </Text>
              <Text variant="caption" color="muted" style={{ marginTop: 4 }}>
                {info}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    marginRight: 6,
                    backgroundColor:
                      ocrStatus === 'error'
                        ? theme.colors.danger
                        : ocrStatus === 'done'
                          ? theme.colors.success
                          : theme.colors.warning,
                  }}
                />
                <Text variant="caption" color="muted">
                  {ocrStatus === 'error'
                    ? 'Analysis will retry during conversion'
                    : ocrStatus === 'done'
                      ? hasTables
                        ? 'Tables detected'
                        : 'Text detected'
                      : 'Analyzing document…'}
                </Text>
              </View>
            </View>
          </View>

          {/* Multi-file switcher */}
          {assets.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: theme.spacing.md }}
              contentContainerStyle={{ gap: 8 }}
            >
              {assets.map((a, i) => (
                <Pressable
                  key={a.id}
                  onPress={() => setActiveIndex(i)}
                  style={[
                    styles.miniThumb,
                    {
                      borderColor: i === activeIndex ? theme.colors.accent : theme.colors.border,
                      borderWidth: i === activeIndex ? 2 : 1,
                      backgroundColor: theme.colors.surfaceAlt,
                    },
                  ]}
                >
                  {a.previewUri ? (
                    <Image source={{ uri: a.previewUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <SourceGlyph format={a.sourceFormat} size={18} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Card>

        {/* Format selection */}
        <Text variant="h2" style={{ marginTop: theme.spacing.xxl, marginBottom: theme.spacing.xs }}>
          What do you want to convert it to?
        </Text>
        <Text variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
          Choose an output format for your editable file.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
          {OUTPUT_FORMATS.map((fmt) => {
            const isSelected = chosen === fmt;
            const recommended = fmt === 'excel' && hasTables;
            return (
              <Pressable
                key={fmt}
                onPress={() => {
                  setManual(true);
                  setSelectedFormat(fmt);
                }}
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                {recommended && (
                  <View style={[styles.recBadge, { backgroundColor: theme.colors.accent }]}>
                    <Ionicons name="sparkles" size={10} color="#fff" />
                    <Text variant="micro" color="onAccent" style={{ marginLeft: 3 }}>
                      RECOMMENDED
                    </Text>
                  </View>
                )}
                <FormatIcon format={fmt} size={46} />
                <Text variant="bodyStrong" style={{ marginTop: theme.spacing.md }}>
                  {FORMAT_META[fmt].label}
                </Text>
                <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                  {FORMAT_META[fmt].blurb}
                </Text>
                {isSelected && (
                  <View style={[styles.check, { backgroundColor: theme.colors.accent }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + theme.spacing.md, backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border },
        ]}
      >
        <Button
          label={`Convert to ${FORMAT_META[chosen].label}`}
          icon="flash"
          gradient
          onPress={() => router.push('/processing')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 76,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  miniThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  formatCard: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 150,
    justifyContent: 'flex-end',
  },
  recBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  check: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
