/** Conversion Result: success, original→converted, and download/share/edit actions. */
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Animated, StyleSheet, ActivityIndicator } from 'react-native';
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
import { useToast } from '@/components/Toast';
import { useConversionStore } from '@/store/useConversionStore';
import { getFileById } from '@/db/database';
import { deliver, shareRecord } from '@/services/io';
import { FORMAT_META, sourceFormatLabel } from '@/utils/formats';
import { formatBytes } from '@/utils/format';
import type { FileRecord } from '@/types';

export default function Result() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string }>();

  const lastResult = useConversionStore((s) => s.lastResult);
  const reset = useConversionStore((s) => s.reset);
  const [record, setRecord] = useState<FileRecord | null>(
    lastResult && (!params.id || lastResult.id === params.id) ? lastResult : null
  );
  const [loading, setLoading] = useState(!record);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!record && params.id) {
      getFileById(params.id).then((r) => {
        setRecord(r);
        setLoading(false);
      });
    }
  }, [params.id, record]);

  useEffect(() => {
    if (record) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [record, scale, opacity]);

  if (loading) {
    return (
      <Screen header={{ showBack: true }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!record) {
    return (
      <Screen header={{ title: 'Result', showBack: true }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text variant="body" color="muted">
            This file could not be found.
          </Text>
        </View>
      </Screen>
    );
  }

  const meta = FORMAT_META[record.outputFormat];

  const onDownload = async () => {
    setDownloading(true);
    try {
      const res = await deliver(record);
      if (res.ok) toast.show(res.message ?? 'Downloaded', 'success');
      else toast.show(res.message ?? 'Could not save the file.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const onShare = async () => {
    setSharing(true);
    try {
      const res = await shareRecord(record);
      if (!res.ok && res.message) toast.show(res.message, 'error');
    } finally {
      setSharing(false);
    }
  };

  const convertAnother = () => {
    reset();
    router.replace('/upload');
  };

  return (
    <Screen header={{ title: 'Done', showBack: true, onBack: () => router.replace('/(tabs)') }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: insets.bottom + 40, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success */}
        <Animated.View
          style={{
            transform: [{ scale }],
            marginTop: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}
        >
          <View style={[styles.successCircle, { backgroundColor: theme.colors.successSoft }]}>
            <View style={[styles.successInner, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
          </View>
        </Animated.View>
        <Text variant="h1" center>
          File ready!
        </Text>
        <Text variant="body" color="muted" center style={{ marginTop: 6, marginBottom: theme.spacing.xxl }}>
          Your document was converted to {meta.productName}.
        </Text>

        {/* Original → Converted */}
        <Animated.View style={{ opacity, width: '100%' }}>
          <Card padded elevation="md" style={{ width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View
                  style={[
                    styles.origThumb,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt },
                  ]}
                >
                  {record.sourceThumbUri ? (
                    <Image source={{ uri: record.sourceThumbUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <SourceGlyph format={record.sourceFormat} size={30} />
                  )}
                </View>
                <Text variant="caption" color="muted" style={{ marginTop: 8 }}>
                  {sourceFormatLabel(record.sourceFormat)}
                </Text>
              </View>

              <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
                <View style={[styles.arrowCircle, { backgroundColor: theme.colors.accentSoft }]}>
                  <Ionicons name="arrow-forward" size={18} color={theme.colors.accent} />
                </View>
              </View>

              <View style={{ alignItems: 'center', flex: 1 }}>
                <FormatIcon format={record.outputFormat} size={56} />
                <Text variant="caption" color="muted" style={{ marginTop: 8 }}>
                  {meta.badge}
                </Text>
              </View>
            </View>

            <View style={[styles.fileMeta, { borderTopColor: theme.colors.border }]}>
              <Ionicons name="document-outline" size={18} color={theme.colors.textMuted} />
              <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, marginLeft: 8 }}>
                {record.name}
              </Text>
              <Text variant="caption" color="muted">
                {formatBytes(record.size)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Actions */}
        <View style={{ width: '100%', marginTop: theme.spacing.xxl }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Preview"
                icon="eye-outline"
                variant="secondary"
                onPress={() => router.push({ pathname: '/editor', params: { id: record.id } })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Share" icon="share-outline" variant="secondary" loading={sharing} onPress={onShare} />
            </View>
          </View>
          <View style={{ height: theme.spacing.md }} />
          <Button label="Download" icon="download-outline" loading={downloading} onPress={onDownload} />
          <View style={{ height: theme.spacing.md }} />
          <Button
            label="Edit Result"
            icon="create-outline"
            variant="secondary"
            onPress={() => router.push({ pathname: '/editor', params: { id: record.id, edit: '1' } })}
          />
          <View style={{ height: theme.spacing.sm }} />
          <Button label="Convert Another File" icon="add" variant="ghost" onPress={convertAnother} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  successCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  origThumb: {
    width: 64,
    height: 78,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
