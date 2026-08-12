/** Files manager: search, filter, sort, and swipe actions over all converted files. */
import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { FileRow } from '@/components/FileRow';
import { EmptyState } from '@/components/EmptyState';
import { FileRowSkeleton } from '@/components/Skeleton';
import { ConfirmDialog, PromptDialog } from '@/components/Dialog';
import { useToast } from '@/components/Toast';
import { useFilesStore } from '@/store/useFilesStore';
import { shareRecord } from '@/services/io';
import { sanitizeFileName } from '@/utils/format';
import { FORMAT_META } from '@/utils/formats';
import type { FileRecord, OutputFormat } from '@/types';

type Filter = 'all' | OutputFormat;
type Sort = 'newest' | 'name' | 'size';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'word', label: 'Word' },
  { key: 'excel', label: 'Excel' },
  { key: 'pdf', label: 'PDF' },
  { key: 'txt', label: 'Text' },
];

const SORTS: { key: Sort; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'newest', label: 'Newest', icon: 'time-outline' },
  { key: 'name', label: 'Name', icon: 'text-outline' },
  { key: 'size', label: 'Size', icon: 'swap-vertical-outline' },
];

export default function Files() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const files = useFilesStore((s) => s.files);
  const loaded = useFilesStore((s) => s.loaded);
  const refresh = useFilesStore((s) => s.refresh);
  const remove = useFilesStore((s) => s.remove);
  const rename = useFilesStore((s) => s.rename);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [toDelete, setToDelete] = useState<FileRecord | null>(null);
  const [toRename, setToRename] = useState<FileRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const data = useMemo(() => {
    let list = files.filter((f) => f.status !== 'failed');
    if (filter !== 'all') list = list.filter((f) => f.outputFormat === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sort === 'newest') sorted.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => b.size - a.size);
    return sorted;
  }, [files, filter, query, sort]);

  const onShare = async (rec: FileRecord) => {
    const res = await shareRecord(rec);
    if (!res.ok && res.message) toast.show(res.message, 'error');
  };

  const confirmRename = (value: string) => {
    if (!toRename) return;
    const ext = FORMAT_META[toRename.outputFormat].extension;
    const clean = sanitizeFileName(value);
    const name = clean.toLowerCase().endsWith(`.${ext}`) ? clean : `${clean}.${ext}`;
    rename(toRename.id, name);
    setToRename(null);
    toast.show('Renamed', 'success');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ paddingTop: insets.top + theme.spacing.md, paddingHorizontal: theme.spacing.xl }}>
        <Text variant="h1">Files</Text>

        {/* Search */}
        <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginTop: theme.spacing.lg }]}>
          <Ionicons name="search" size={18} color={theme.colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search files"
            placeholderTextColor={theme.colors.textFaint}
            style={[styles.searchInput, { color: theme.colors.text }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textFaint} />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: theme.spacing.md, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} tone="accent" />
          ))}
        </View>

        {/* Sort */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }}>
          <Text variant="caption" color="muted" style={{ marginRight: 8 }}>
            Sort:
          </Text>
          {SORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}
            >
              <Ionicons name={s.icon} size={14} color={sort === s.key ? theme.colors.accent : theme.colors.textFaint} />
              <Text variant="captionStrong" color={sort === s.key ? 'accent' : 'faint'} style={{ marginLeft: 4 }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {!loaded ? (
        <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <FileRowSkeleton key={i} />
          ))}
        </View>
      ) : data.length === 0 ? (
        <EmptyState
          icon={query || filter !== 'all' ? 'search-outline' : 'folder-open-outline'}
          title={query || filter !== 'all' ? 'No matching files' : 'No files yet'}
          message={
            query || filter !== 'all'
              ? 'Try a different search or filter.'
              : 'Your converted files will appear here.'
          }
          actionLabel={query || filter !== 'all' ? undefined : 'Convert a document'}
          onAction={() => router.push('/upload')}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(f) => f.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingTop: 4 }}
          keyboardDismissMode="on-drag"
          removeClippedSubviews
          renderItem={({ item }) => (
            <FileRow
              record={item}
              mode="file"
              onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
              onRename={() => setToRename(item)}
              onShare={() => onShare(item)}
              onDelete={() => setToDelete(item)}
            />
          )}
        />
      )}

      <ConfirmDialog
        visible={!!toDelete}
        title="Delete file?"
        message={toDelete ? `“${toDelete.name}” will be permanently removed from this device.` : ''}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
        onConfirm={() => {
          if (toDelete) {
            remove(toDelete.id);
            toast.show('File deleted', 'success');
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />

      <PromptDialog
        visible={!!toRename}
        title="Rename file"
        initialValue={toRename ? toRename.name.replace(/\.[^.]+$/, '') : ''}
        placeholder="File name"
        onConfirm={confirmRename}
        onCancel={() => setToRename(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, height: '100%' },
});
