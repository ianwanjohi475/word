/** OCR Processing: animated scan preview, progress ring, staged steps, error/retry. */
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { ProgressRing } from '@/components/ProgressRing';
import { SourceGlyph } from '@/components/FormatIcon';
import { useConversionStore } from '@/store/useConversionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useFilesStore } from '@/store/useFilesStore';
import { startOcr, subscribeOcr, retryOcr, getOcrJob } from '@/services/ocrController';
import { convert } from '@/services/pipeline';
import type { OcrError } from '@/services/groq';
import type { PipelineStage } from '@/types';
import { stripExtension } from '@/utils/format';

const STEPS: { key: PipelineStage; label: string }[] = [
  { key: 'uploading', label: 'Preparing document' },
  { key: 'detecting', label: 'Reading content' },
  { key: 'layout', label: 'Understanding layout' },
  { key: 'formatting', label: 'Formatting output' },
  { key: 'saving', label: 'Creating file' },
];

const STAGE_INDEX: Record<PipelineStage, number> = {
  idle: 0,
  uploading: 0,
  detecting: 1,
  layout: 2,
  formatting: 3,
  saving: 4,
  done: 5,
  error: -1,
};

function errorTitle(kind: OcrError['kind']): { title: string; icon: keyof typeof Ionicons.glyphMap } {
  switch (kind) {
    case 'no_key':
      return { title: 'API key needed', icon: 'key-outline' };
    case 'network':
      return { title: 'No connection', icon: 'cloud-offline-outline' };
    case 'rate_limit':
      return { title: 'Too many requests', icon: 'hourglass-outline' };
    case 'auth':
      return { title: 'Invalid API key', icon: 'lock-closed-outline' };
    default:
      return { title: 'Conversion failed', icon: 'alert-circle-outline' };
  }
}

export default function Processing() {
  const theme = useTheme();
  const router = useRouter();

  const active = useConversionStore((s) => s.activeAsset());
  const selectedFormat = useConversionStore((s) => s.selectedFormat);
  const defaultFormat = useSettingsStore((s) => s.defaultFormat);
  const setLastResult = useConversionStore((s) => s.setLastResult);
  const setCurrentDoc = useConversionStore((s) => s.setCurrentDoc);
  const refreshFiles = useFilesStore((s) => s.refresh);

  const format = selectedFormat ?? defaultFormat;

  const [stage, setStage] = useState<PipelineStage>('uploading');
  const [progress, setProgress] = useState(0.08);
  const [message, setMessage] = useState('Preparing your document');
  const [error, setError] = useState<OcrError | null>(null);

  const generatingRef = useRef(false);
  const scanY = useRef(new Animated.Value(0)).current;

  // Scanning line animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(scanY, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanY]);

  const runGeneration = async () => {
    if (generatingRef.current || !active) return;
    generatingRef.current = true;
    try {
      setStage('formatting');
      setProgress(0.8);
      setMessage('Formatting document');
      // Small beat so the UI shows the formatting step.
      await new Promise((r) => setTimeout(r, 350));

      setStage('saving');
      setProgress(0.93);
      setMessage('Creating file');

      const { record, doc } = await convert({
        asset: active,
        format,
        // Reuse the OCR document already produced by the controller.
        doc: getOcrJob(active.id)?.doc ?? undefined,
        baseName: stripExtension(active.name),
      });

      setCurrentDoc(doc);
      setLastResult(record);
      await refreshFiles();

      setStage('done');
      setProgress(1);
      setTimeout(() => router.replace({ pathname: '/result', params: { id: record.id } }), 350);
    } catch (e) {
      setError(e as OcrError);
      setStage('error');
    }
  };

  useEffect(() => {
    if (!active) {
      router.replace('/upload');
      return;
    }
    startOcr(active);
    const unsub = subscribeOcr((job) => {
      if (job.assetId !== active.id) return;
      if (job.status === 'error') {
        setError(job.error);
        setStage('error');
        return;
      }
      if (job.status === 'running') {
        setStage(job.progress.stage);
        setProgress(job.progress.progress);
        if (job.progress.message) setMessage(job.progress.message);
      }
      if (job.status === 'done') {
        void runGeneration();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const retry = () => {
    if (!active) return;
    setError(null);
    setStage('uploading');
    setProgress(0.08);
    generatingRef.current = false;
    retryOcr(active);
  };

  if (!active) return <Screen header={{ showBack: false }}>{null}</Screen>;

  // ---- Error state ----
  if (stage === 'error' && error) {
    const { title, icon } = errorTitle(error.kind);
    return (
      <Screen header={{ showBack: true }}>
        <View style={styles.errorWrap}>
          <View style={[styles.errorIcon, { backgroundColor: theme.colors.dangerSoft }]}>
            <Ionicons name={icon} size={40} color={theme.colors.danger} />
          </View>
          <Text variant="h2" center>
            {title}
          </Text>
          <Text variant="body" color="muted" center style={{ marginTop: 8, maxWidth: 320 }}>
            {error.message}
          </Text>
          <View style={{ height: 28, width: '100%' }} />
          {error.retryable && <Button label="Try again" icon="refresh" onPress={retry} />}
          <View style={{ height: 10 }} />
          <Button
            label="Back"
            variant="ghost"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          />
        </View>
      </Screen>
    );
  }

  const currentIndex = STAGE_INDEX[stage];

  return (
    <Screen header={{ showBack: false }}>
      <View style={styles.container}>
        {/* Scan preview */}
        <View style={[styles.previewWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}>
          {active.previewUri ? (
            <Image source={{ uri: active.previewUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.pdfPreview}>
              <SourceGlyph format={active.sourceFormat} size={54} />
            </View>
          )}
          <Animated.View
            style={[
              styles.scanLine,
              {
                backgroundColor: theme.colors.accent,
                transform: [
                  {
                    translateY: scanY.interpolate({ inputRange: [0, 1], outputRange: [6, 214] }),
                  },
                ],
              },
            ]}
          />
          <View style={[styles.scanBadge, { backgroundColor: theme.colors.accent }]}>
            <Ionicons name="scan" size={13} color="#fff" />
            <Text variant="micro" color="onAccent" style={{ marginLeft: 4 }}>
              READING
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
        <ProgressRing progress={progress} label={message} />

        <Text variant="h3" center style={{ marginTop: 24 }}>
          Converting your document
        </Text>
        <Text variant="caption" color="muted" center style={{ marginTop: 4 }}>
          This usually takes just a few seconds
        </Text>

        {/* Staged steps */}
        <View style={{ marginTop: 24, width: '100%', maxWidth: 340, alignSelf: 'center' }}>
          {STEPS.map((step, i) => {
            const done = i < currentIndex;
            const activeStep = i === currentIndex;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: done
                        ? theme.colors.success
                        : activeStep
                          ? theme.colors.accent
                          : theme.colors.surfaceAlt,
                      borderColor: done || activeStep ? 'transparent' : theme.colors.border,
                    },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  ) : activeStep ? (
                    <View style={styles.pulse} />
                  ) : (
                    <Text variant="micro" color="faint">
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  variant={activeStep ? 'bodyStrong' : 'body'}
                  color={done || activeStep ? 'text' : 'faint'}
                  style={{ marginLeft: 12 }}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8, alignItems: 'center' },
  previewWrap: {
    width: 168,
    height: 224,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  pdfPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  scanBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});
