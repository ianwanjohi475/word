/** History: past conversions grouped by date with quick download/share per row. */
import React, { useCallback, useMemo, useState } from 'react';
import { View, SectionList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';
import { FormatIcon, SourceGlyph } from '@/components/FormatIcon';
import { EmptyState } from '@/components/EmptyState';
import { FileRowSkeleton } from '@/components/Skeleton';
import { ConfirmDialog } from '@/components/Dialog';
import { useToast } from '@/components/Toast';
import { useFilesStore } from '@/store/useFilesStore';
import { downloadFile, shareFile } from '@/services/files';
import { FORMAT_META, sourceFormatLabel } from '@/utils/formats';
import { formatDateTime } from '@/utils/format';
import type { FileRecord } from '@/types';

function dayBucket(ts: number, now = Date.now()): string {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const day = 86400000;
  if (ts >= startOfToday) return 'Today';
  if (ts >= startOfToday - day) return 'Yesterday';
  if (ts >= startOfToday - 6 * day) return 'This week';
  return 'Earlier';
}

export default function History() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const files = useFilesStore((s) => s.files);
  const loaded = useFilesStore((s) => s.loaded);
  const refresh = useFilesStore((s) => s.refresh);
  const clearHistory = useFilesStore((s) => s.clearHistory);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const sections = useMemo(() => {
    const order = ['Today', 'Yesterday', 'This week', 'Earlier'];
    const map = new Map<string, FileRecord[]>();
    for (const f of files) {
      const b = dayBucket(f.createdAt);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(f);
    }
    return order.filter((o) => map.has(o)).map((title) => ({ title, data: map.get(title)! }));
  }, [files]);

  const quickShare = async (rec: FileRecord) => {
    if (rec.status !== 'completed') return;
    setBusyId(rec.id);
    try {
      await shareFile(rec.path, rec.outputFormat);
    } catch (e) {
      toast.show((e as Error).message || 'Could not share.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const quickDownload = async (rec: FileRecord) => {
    if (rec.status !== 'completed') return;
    setBusyId(rec.id);
    try {
      const res = await downloadFile(rec.path, rec.name, rec.outputFormat);
      if (res.kind === 'saved') toast.show(`Saved to ${res.location}`, 'success');
      else if (res.kind === 'shared') toast.show('Choose “Save to Files” to download', 'info');
    } catch {
      toast.show('Could not download.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text variant="h1" style={{ flex: 1 }}>
          History
        </Text>
        {files.length > 0 && (
          <Pressable onPress={() => setConfirmClear(true)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
            <Text variant="captionStrong" color="danger" style={{ marginLeft: 4 }}>
              Clear
            </Text>
          </Pressable>
        )}
      </View>

      {!loaded ? (
        <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: 12 }}>
          {[0, 1, 2].map((i) => (
            <FileRowSkeleton key={i} />
          ))}
        </View>
      ) : files.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No history yet"
          message="Conversions you run will be listed here so you can find and re-share them anytime."
          actionLabel="Start converting"
          onAction={() => router.push('/upload')}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingTop: 8 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text
              variant="captionStrong"
              color="muted"
              style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.sm }}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const meta = FORMAT_META[item.outputFormat];
            const failed = item.status === 'failed';
            return (
              <Pressable
                onPress={() => !failed && router.push({ pathname: '/result', params: { id: item.id } })}
                style={[styles.row, { borderBottomColor: theme.colors.border }]}
              >
                <View style={[styles.thumb, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}>
                  {item.sourceThumbUri ? (
                    <Image source={{ uri: item.sourceThumbUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <SourceGlyph format={item.sourceFormat} size={20} />
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="captionStrong" color="muted">
                      {sourceFormatLabel(item.sourceFormat)}
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color={theme.colors.textFaint} style={{ marginHorizontal: 5 }} />
                    <Text variant="captionStrong" color="accent">
                      {meta.label}
                    </Text>
                  </View>
                  <Text variant="bodyStrong" numberOfLines={1} style={{ marginTop: 2 }}>
                    {item.name}
                  </Text>
                  <Text variant="micro" color="faint" style={{ marginTop: 2 }}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>

                {failed ? (
                  <View style={[styles.failPill, { backgroundColor: theme.colors.dangerSoft }]}>
                    <Text variant="micro" color="danger">
                      Failed
                    </Text>
                  </View>
                ) : busyId === item.id ? (
                  <ActivityIndicator color={theme.colors.accent} style={{ width: 72 }} />
                ) : (
                  <View style={{ flexDirection: 'row' }}>
                    <Pressable onPress={() => quickDownload(item)} hitSlop={6} style={styles.quickBtn}>
                      <Ionicons name="download-outline" size={19} color={theme.colors.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => quickShare(item)} hitSlop={6} style={styles.quickBtn}>
                      <Ionicons name="share-outline" size={19} color={theme.colors.textMuted} />
                    </Pressable>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      <ConfirmDialog
        visible={confirmClear}
        title="Clear all history?"
        message="This deletes every converted file and its record from this device. This can't be undone."
        confirmLabel="Clear history"
        destructive
        icon="trash-outline"
        onConfirm={async () => {
          await clearHistory();
          setConfirmClear(false);
          toast.show('History cleared', 'success');
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 42,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  failPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
});
