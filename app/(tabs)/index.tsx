/** Home dashboard: greeting, primary actions, quick conversions, recents, history. */
import React, { useCallback } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SectionHeader } from '@/components/SectionHeader';
import { QuickActionCard } from '@/components/QuickActionCard';
import { RecentFileCard } from '@/components/RecentFileCard';
import { FileRow } from '@/components/FileRow';
import { EmptyState } from '@/components/EmptyState';
import { useConvertFlow } from '@/hooks/useConvertFlow';
import { useFilesStore } from '@/store/useFilesStore';
import { greetingForNow } from '@/utils/format';
import type { OutputFormat, SourceFormat } from '@/types';

const QUICK: { source: SourceFormat; target: OutputFormat }[] = [
  { source: 'image', target: 'word' },
  { source: 'image', target: 'excel' },
  { source: 'pdf', target: 'word' },
  { source: 'pdf', target: 'excel' },
];

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { run } = useConvertFlow();
  const files = useFilesStore((s) => s.files);
  const refresh = useFilesStore((s) => s.refresh);
  const loading = useFilesStore((s) => s.loading);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const completed = files.filter((f) => f.status === 'completed');
  const recent = completed.slice(0, 8);
  const historyPreview = files.slice(0, 4);

  const gap = theme.spacing.md;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.spacing.md,
          paddingBottom: insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.accent} />}
      >
        {/* Greeting */}
        <View style={{ paddingHorizontal: theme.spacing.xl, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="muted">
              {greetingForNow()}
            </Text>
            <Text variant="h1" style={{ marginTop: 2 }}>
              Let's convert
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/settings')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="person-outline" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Primary actions */}
        <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.xl }}>
          <Card padded elevation="md" style={{ backgroundColor: theme.colors.accent, borderColor: 'transparent' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
                <Text variant="h3" color="onAccent">
                  Convert a document
                </Text>
                <Text variant="caption" color="onAccent" style={{ opacity: 0.85, marginTop: 4 }}>
                  Images & PDFs → Word, Excel, PDF or text
                </Text>
              </View>
              <Ionicons name="documents-outline" size={40} color="#fff" style={{ opacity: 0.9 }} />
            </View>
            <View style={{ height: theme.spacing.lg }} />
            <View style={{ backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: theme.radius.md }}>
              <Button
                label="Upload File"
                icon="cloud-upload-outline"
                variant="secondary"
                onPress={() => router.push('/upload')}
                style={{ backgroundColor: '#fff' }}
              />
            </View>
          </Card>
          <View style={{ height: theme.spacing.md }} />
          <Button label="Scan Document" icon="scan-outline" variant="secondary" onPress={() => router.push('/scan')} />
        </View>

        {/* Quick conversions */}
        <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.xxl }}>
          <SectionHeader title="Quick conversions" />
          <View style={{ flexDirection: 'row', gap }}>
            <View style={{ flex: 1, gap }}>
              <QuickActionCard {...QUICK[0]} onPress={() => run('gallery', QUICK[0].target)} />
              <QuickActionCard {...QUICK[2]} onPress={() => run('documents', QUICK[2].target)} />
            </View>
            <View style={{ flex: 1, gap }}>
              <QuickActionCard {...QUICK[1]} onPress={() => run('gallery', QUICK[1].target)} />
              <QuickActionCard {...QUICK[3]} onPress={() => run('documents', QUICK[3].target)} />
            </View>
          </View>
        </View>

        {/* Recent files */}
        {recent.length > 0 && (
          <View style={{ marginTop: theme.spacing.xxl }}>
            <View style={{ paddingHorizontal: theme.spacing.xl }}>
              <SectionHeader title="Recent files" actionLabel="See all" onAction={() => router.push('/(tabs)/files')} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, gap }}
            >
              {recent.map((f) => (
                <RecentFileCard key={f.id} record={f} onPress={() => router.push({ pathname: '/result', params: { id: f.id } })} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* History preview */}
        <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.xxl }}>
          <SectionHeader
            title="Recent activity"
            actionLabel={files.length > 0 ? 'See all' : undefined}
            onAction={() => router.push('/(tabs)/history')}
          />
          {files.length === 0 ? (
            <Card padded>
              <EmptyState
                compact
                icon="document-text-outline"
                title="No conversions yet"
                message="Upload or scan a document to create your first editable file."
                actionLabel="Upload File"
                onAction={() => router.push('/upload')}
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {historyPreview.map((f) => (
                <FileRow
                  key={f.id}
                  record={f}
                  mode="history"
                  onPress={() => router.push({ pathname: '/result', params: { id: f.id } })}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
