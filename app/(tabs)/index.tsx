/** Home dashboard — premium layout: brand, search, gradient hero, stats, tools. */
import React, { useCallback } from 'react';
import { View, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, gradients } from '@/theme';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Logo } from '@/components/Logo';
import { SectionHeader } from '@/components/SectionHeader';
import { ToolTile } from '@/components/ToolTile';
import { StatCard } from '@/components/StatCard';
import { RecentFileCard } from '@/components/RecentFileCard';
import { FileRow } from '@/components/FileRow';
import { EmptyState } from '@/components/EmptyState';
import { useConvertFlow } from '@/hooks/useConvertFlow';
import { useConversionStore } from '@/store/useConversionStore';
import { pickDocuments, PickerCancelled } from '@/services/picker';
import { useToast } from '@/components/Toast';
import { useFilesStore } from '@/store/useFilesStore';
import { greetingForNow } from '@/utils/format';

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { run } = useConvertFlow();
  const toast = useToast();
  const setAssets = useConversionStore((s) => s.setAssets);
  const files = useFilesStore((s) => s.files);
  const refresh = useFilesStore((s) => s.refresh);
  const loading = useFilesStore((s) => s.loading);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const editPdf = async () => {
    try {
      const picked = await pickDocuments();
      const pdf = picked.find((a) => a.sourceFormat === 'pdf');
      if (!pdf) {
        if (picked.length) toast.show('Pick a PDF file to edit.', 'error');
        return;
      }
      setAssets([pdf]);
      router.push('/pdfedit');
    } catch (e) {
      if (e instanceof PickerCancelled) return;
      toast.show('Could not open that file.', 'error');
    }
  };

  const completed = files.filter((f) => f.status === 'completed');
  const recent = completed.slice(0, 8);
  const historyPreview = files.slice(0, 4);
  const weekCount = completed.filter((f) => Date.now() - f.createdAt < 7 * 86400000).length;
  const gap = theme.spacing.md;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + theme.spacing.sm, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.accent} />}
      >
        {/* Brand + settings */}
        <View style={styles.header}>
          <Logo size={38} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text variant="h3">Converta</Text>
            <Text variant="micro" color="muted">
              {greetingForNow().toUpperCase()}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/settings')} style={[styles.iconBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Search */}
        <Pressable onPress={() => router.push('/(tabs)/files')} style={{ paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.md }}>
          <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={18} color={theme.colors.textFaint} />
            <Text variant="body" color="faint" style={{ marginLeft: 10 }}>
              Search your files…
            </Text>
          </View>
        </Pressable>

        {/* Gradient hero */}
        <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.lg }}>
          <LinearGradient colors={gradients.brandDeep} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, theme.shadows.md]}>
            <View style={[styles.blob, { top: -50, right: -30 }]} />
            <View style={[styles.blob, { bottom: -60, left: -20, width: 150, height: 150 }]} />
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={12} color="#fff" />
              <Text variant="micro" color="onAccent" style={{ marginLeft: 4 }}>
                LOCAL · UNLIMITED · NO SIGN-IN
              </Text>
            </View>
            <Text variant="h1" style={{ color: '#fff', marginTop: 12 }}>
              Convert & edit{'\n'}documents
            </Text>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 19 }}>
              Word ⇆ PDF ⇆ Excel and a full PDF editor — all on your device.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Pressable onPress={() => router.push('/upload')} style={[styles.heroBtn, { backgroundColor: '#fff' }]}>
                <Ionicons name="swap-horizontal" size={18} color="#0B6E55" />
                <Text variant="bodyStrong" style={{ color: '#0B6E55', marginLeft: 8 }}>
                  Convert
                </Text>
              </Pressable>
              <Pressable onPress={editPdf} style={[styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text variant="bodyStrong" style={{ color: '#fff', marginLeft: 8 }}>
                  Edit PDF
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap, paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.lg }}>
          <StatCard value={String(completed.length)} label="Files" icon="documents-outline" tint={theme.colors.accent} softBg={theme.colors.accentSoft} />
          <StatCard value={String(weekCount)} label="This week" icon="trending-up-outline" tint="#2E76E8" softBg="#E8EFFB" />
          <StatCard value="4" label="Formats" icon="grid-outline" tint="#E5872B" softBg="#FBEFDD" />
        </View>

        {/* Quick tools */}
        <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.xxl }}>
          <SectionHeader title="Quick tools" />
          <View style={{ gap }}>
            <View style={{ flexDirection: 'row', gap }}>
              <ToolTile icon="document-text" title="Word → PDF" subtitle="Export .docx to PDF" colors={gradients.word} onPress={() => run('pdf')} />
              <ToolTile icon="document" title="PDF → Word" subtitle="Editable .docx" colors={gradients.pdf} onPress={() => run('word')} />
            </View>
            <View style={{ flexDirection: 'row', gap }}>
              <ToolTile icon="grid" title="Word → Excel" subtitle="Pull out tables" colors={gradients.excel} onPress={() => run('excel')} />
              <ToolTile icon="create" title="Edit a PDF" subtitle="Text, erase, sign" colors={gradients.violet} onPress={editPdf} />
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
                message="Upload a document or edit a PDF to get started."
                actionLabel="Upload a document"
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  hero: { borderRadius: 24, padding: 20, overflow: 'hidden' },
  blob: { position: 'absolute', width: 120, height: 120, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroBtn: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
