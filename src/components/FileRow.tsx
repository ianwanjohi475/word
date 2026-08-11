/**
 * File/history list row: format icon, name, meta line, status, and optional
 * swipe-to-reveal actions (rename / share / delete).
 */
import React, { useRef } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { FormatIcon, SourceGlyph } from './FormatIcon';
import type { FileRecord } from '@/types';
import { FORMAT_META, sourceFormatLabel } from '@/utils/formats';
import { formatBytes, formatRelativeDate } from '@/utils/format';

interface Props {
  record: FileRecord;
  onPress?: () => void;
  onRename?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  mode?: 'file' | 'history';
}

function StatusDot({ status }: { status: FileRecord['status'] }) {
  const theme = useTheme();
  if (status === 'completed') return null;
  const color = status === 'failed' ? theme.colors.danger : theme.colors.warning;
  const label = status === 'failed' ? 'Failed' : 'Processing';
  return (
    <View style={[styles.statusPill, { backgroundColor: status === 'failed' ? theme.colors.dangerSoft : theme.colors.warningSoft }]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 5 }} />
      <Text variant="micro" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

export function FileRow({ record, onPress, onRename, onShare, onDelete, mode = 'file' }: Props) {
  const theme = useTheme();
  const swipeRef = useRef<Swipeable>(null);
  const meta = FORMAT_META[record.outputFormat];

  const subtitle =
    mode === 'history'
      ? `${sourceFormatLabel(record.sourceFormat)} → ${meta.label} · ${formatRelativeDate(record.createdAt)}`
      : `${meta.badge} · ${formatBytes(record.size)} · ${formatRelativeDate(record.createdAt)}`;

  const hasActions = !!(onRename || onShare || onDelete);

  const renderRightActions = () => (
    <View style={styles.actions}>
      {onRename && (
        <Pressable
          style={[styles.action, { backgroundColor: theme.colors.info }]}
          onPress={() => {
            swipeRef.current?.close();
            onRename();
          }}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text variant="micro" color="onAccent" style={{ marginTop: 2 }}>
            Rename
          </Text>
        </Pressable>
      )}
      {onShare && (
        <Pressable
          style={[styles.action, { backgroundColor: theme.colors.accent }]}
          onPress={() => {
            swipeRef.current?.close();
            onShare();
          }}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text variant="micro" color="onAccent" style={{ marginTop: 2 }}>
            Share
          </Text>
        </Pressable>
      )}
      {onDelete && (
        <Pressable
          style={[styles.action, { backgroundColor: theme.colors.danger }]}
          onPress={() => {
            swipeRef.current?.close();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text variant="micro" color="onAccent" style={{ marginTop: 2 }}>
            Delete
          </Text>
        </Pressable>
      )}
    </View>
  );

  const row = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface,
          borderColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <FormatIcon format={record.outputFormat} size={38} />
      </View>
      <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {record.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
          {mode === 'history' && <SourceGlyph format={record.sourceFormat} size={15} />}
          <Text variant="caption" color="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {subtitle}
          </Text>
        </View>
      </View>
      <StatusDot status={record.status} />
      {onPress && <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} style={{ marginLeft: 4 }} />}
    </Pressable>
  );

  if (!hasActions) return row;

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
      {row}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: { width: 40, alignItems: 'center' },
  actions: { flexDirection: 'row' },
  action: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 6,
  },
});
