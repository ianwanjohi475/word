/** Home dashboard: greeting, search, hero CTA, quick conversions, recents, activity. */
import React, { useCallback } from 'react';
import { View, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette } from '@/theme';
import { Text } from '@/components/Text';
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
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + theme.spacing.md, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="muted">
              {greetingForNow()} 👋
            </Text>
            <Text variant="h1" style={{ marginTop: 2 }}>
              Let's convert
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/settings')} style={[styles.iconBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Search */}
        <Pressable onPress={() => router.push('/(tabs)/files')} style={{ paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.lg }}>
          <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={18} color={theme.colors.textFaint} />
            <Text variant="body" color="faint" style={{ marginLeft: 10 }}>
              Search your files…
            </Text>
          </View>
        </Pressable>

        {/* Hero banner */}
        <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.lg }}>
          <View style={[styles.hero, theme.shadows.md]}>
            <View style={styles.heroGlow} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text variant="h2" style={{ color: '#fff' }}>
                  Your document,{'\n'}editable in seconds
                </Text>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.82)', marginTop: 8, lineHeight: 19 }}>
                  Scan or upload — get Word, Excel, PDF or text back.
                </Text>
              </View>
              <Ionicons name="documents" size={40} color="rgba(255,255,255,0.9)" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Pressable onPress={() => router.push('/upload')} style={[styles.heroBtn, { backgroundColor: '#fff' }]}>
                <Ionicons name="cloud-upload-outline" size={18} color={palette.accent} />
                <Text variant="bodyStrong" style={{ color: palette.accent, marginLeft: 8 }}>
                  Upload File
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push('/scan')} style={[styles.heroBtn, styles.heroBtnGhost]}>
                <Ionicons name="scan-outline" size={18} color="#fff" />
                <Text variant="bodyStrong" style={{ color: '#fff', marginLeft: 8 }}>
                  Scan
                </Text>
              </Pressable>
            </View>
          </View>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, gap }}>
              {recent.map((f) => (
                <RecentFileCard key={f.id} record={f} onPress={() => router.push({ pathname: '/result', params: { id: f.id } })} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Activity */}
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
                <FileRow key={f.id} record={f} mode="history" onPress={() => router.push({ pathname: '/result', params: { id: f.id } })} />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  hero: {
    backgroundColor: palette.accentDeep,
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBtn: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnGhost: { backgroundColor: 'rgba(255,255,255,0.16)' },
});
