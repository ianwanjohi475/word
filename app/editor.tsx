/**
 * Document Preview / Editor.
 *
 * Loads a converted file's stored DocumentModel and lets the user correct OCR
 * text, edit paragraphs and individual table cells, undo/redo, save changes back
 * to the file, and re-export to any format.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { FormatIcon } from '@/components/FormatIcon';
import { DialogBase } from '@/components/Dialog';
import { useToast } from '@/components/Toast';
import { useHistoryState } from '@/hooks/useHistoryState';
import { useConversionStore } from '@/store/useConversionStore';
import { useFilesStore } from '@/store/useFilesStore';
import { getFileById, insertFile, updateFileFields } from '@/db/database';
import { generateFile } from '@/services/pipeline';
import { OUTPUT_FORMATS, FORMAT_META } from '@/utils/formats';
import { stripExtension } from '@/utils/format';
import { uid } from '@/utils/id';
import type { DocBlock, DocumentModel, FileRecord, OutputFormat } from '@/types';

export default function Editor() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string; edit?: string }>();
  const refreshFiles = useFilesStore((s) => s.refresh);
  const setLastResult = useConversionStore((s) => s.setLastResult);

  const [record, setRecord] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<OutputFormat | null>(null);
  const [showExport, setShowExport] = useState(false);

  const doc = useHistoryState<DocumentModel>({ blocks: [], hasTables: false });
  const focusSnapshotted = useRef(false);

  useEffect(() => {
    (async () => {
      if (!params.id) {
        setLoading(false);
        return;
      }
      const rec = await getFileById(params.id);
      setRecord(rec);
      if (rec?.documentJson) {
        try {
          doc.reset(JSON.parse(rec.documentJson) as DocumentModel);
        } catch {
          doc.reset({ blocks: [], hasTables: false });
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Snapshot once per editing session (on first focus after a settled state).
  const beginEdit = () => {
    if (!focusSnapshotted.current) {
      doc.snapshot();
      focusSnapshotted.current = true;
    }
  };
  const endEdit = () => {
    focusSnapshotted.current = false;
  };

  const setBlocks = (mutate: (blocks: DocBlock[]) => DocBlock[]) => {
    doc.set((prev) => ({ ...prev, blocks: mutate(prev.blocks) }));
  };

  const updateText = (index: number, text: string) => {
    setBlocks((blocks) =>
      blocks.map((b, i) => (i === index && (b.type === 'heading' || b.type === 'paragraph') ? { ...b, text } : b))
    );
  };

  const updateCell = (bi: number, r: number, c: number, text: string) => {
    setBlocks((blocks) =>
      blocks.map((b, i) => {
        if (i !== bi || b.type !== 'table') return b;
        const rows = b.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? text : cell)) : row));
        return { ...b, rows };
      })
    );
  };

  const updateHeader = (bi: number, c: number, text: string) => {
    setBlocks((blocks) =>
      blocks.map((b, i) => {
        if (i !== bi || b.type !== 'table' || !b.headers) return b;
        return { ...b, headers: b.headers.map((h, ci) => (ci === c ? text : h)) };
      })
    );
  };

  const addRow = (bi: number) => {
    doc.snapshot();
    focusSnapshotted.current = false;
    setBlocks((blocks) =>
      blocks.map((b, i) => {
        if (i !== bi || b.type !== 'table') return b;
        const cols = b.headers?.length ?? b.rows[0]?.length ?? 1;
        return { ...b, rows: [...b.rows, new Array(cols).fill('')] };
      })
    );
  };

  const deleteRow = (bi: number, r: number) => {
    doc.snapshot();
    focusSnapshotted.current = false;
    setBlocks((blocks) =>
      blocks.map((b, i) => (i === bi && b.type === 'table' ? { ...b, rows: b.rows.filter((_, ri) => ri !== r) } : b))
    );
  };

  const persist = async (): Promise<boolean> => {
    if (!record) return false;
    setSaving(true);
    try {
      // Re-generate the file in its own format so the on-disk file matches edits.
      const baseName = stripExtension(record.name);
      const { path, size } = await generateFile(doc.present, record.outputFormat, baseName + ' (edited)');
      await updateFileFields(record.id, {
        documentJson: JSON.stringify(doc.present),
        path,
        size,
      });
      const updated = { ...record, path, size, documentJson: JSON.stringify(doc.present) };
      setRecord(updated);
      await refreshFiles();
      doc.reset(doc.present);
      toast.show('Changes saved', 'success');
      return true;
    } catch {
      toast.show('Could not save changes.', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const reExport = async (format: OutputFormat) => {
    if (!record) return;
    setExporting(format);
    try {
      const baseName = stripExtension(record.name);
      const { path, name, size } = await generateFile(doc.present, format, baseName);
      const newRecord: FileRecord = {
        id: uid('f_'),
        name,
        outputFormat: format,
        sourceFormat: record.sourceFormat,
        path,
        size,
        createdAt: Date.now(),
        status: 'completed',
        documentJson: JSON.stringify(doc.present),
        sourceThumbUri: record.sourceThumbUri,
      };
      await insertFile(newRecord);
      setLastResult(newRecord);
      await refreshFiles();
      setShowExport(false);
      toast.show(`Exported as ${FORMAT_META[format].label}`, 'success');
      router.replace({ pathname: '/result', params: { id: newRecord.id } });
    } catch {
      toast.show('Export failed. Please try again.', 'error');
    } finally {
      setExporting(null);
    }
  };

  const isTableDoc = useMemo(() => doc.present.blocks.some((b) => b.type === 'table'), [doc.present.blocks]);

  if (loading) {
    return (
      <Screen header={{ title: 'Editor', showBack: true }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!record) {
    return (
      <Screen header={{ title: 'Editor', showBack: true }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text variant="body" color="muted">
            This document could not be loaded.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={{
        title: 'Edit document',
        showBack: true,
        right: (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <IconBtn icon="arrow-undo" disabled={!doc.canUndo} onPress={doc.undo} />
            <IconBtn icon="arrow-redo" disabled={!doc.canRedo} onPress={doc.redo} />
          </View>
        ),
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: insets.bottom + 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {doc.present.title !== undefined && (
            <TextInput
              value={doc.present.title ?? ''}
              onFocus={beginEdit}
              onBlur={endEdit}
              onChangeText={(t) => doc.set((p) => ({ ...p, title: t }))}
              placeholder="Document title"
              placeholderTextColor={theme.colors.textFaint}
              style={[styles.titleInput, { color: theme.colors.text }]}
              multiline
            />
          )}

          {doc.present.blocks.length === 0 && (
            <Text variant="body" color="muted" center style={{ marginTop: 40 }}>
              No content to edit.
            </Text>
          )}

          {doc.present.blocks.map((block, bi) => {
            if (block.type === 'heading') {
              return (
                <View key={bi} style={{ marginTop: theme.spacing.lg }}>
                  <Text variant="micro" color="faint" style={{ marginBottom: 4 }}>
                    HEADING {block.level}
                  </Text>
                  <TextInput
                    value={block.text}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChangeText={(t) => updateText(bi, t)}
                    multiline
                    style={[
                      styles.blockInput,
                      block.level === 1 ? theme.typography.h2 : block.level === 2 ? theme.typography.h3 : theme.typography.bodyStrong,
                      { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                  />
                </View>
              );
            }
            if (block.type === 'paragraph') {
              return (
                <View key={bi} style={{ marginTop: theme.spacing.md }}>
                  <TextInput
                    value={block.text}
                    onFocus={beginEdit}
                    onBlur={endEdit}
                    onChangeText={(t) => updateText(bi, t)}
                    multiline
                    style={[
                      styles.blockInput,
                      theme.typography.body,
                      { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                  />
                </View>
              );
            }
            // table
            const cols = block.headers?.length ?? block.rows[0]?.length ?? 1;
            return (
              <View key={bi} style={{ marginTop: theme.spacing.xl }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="grid-outline" size={14} color={theme.colors.textMuted} />
                  <Text variant="micro" color="faint" style={{ marginLeft: 4 }}>
                    TABLE · {block.rows.length} rows × {cols} cols
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, overflow: 'hidden' }}>
                    {block.headers && (
                      <View style={{ flexDirection: 'row', backgroundColor: theme.colors.accentSoft }}>
                        {block.headers.map((h, c) => (
                          <TextInput
                            key={c}
                            value={h}
                            onFocus={beginEdit}
                            onBlur={endEdit}
                            onChangeText={(t) => updateHeader(bi, c, t)}
                            style={[styles.cell, styles.headerCell, { color: theme.colors.accent, borderColor: theme.colors.border }]}
                          />
                        ))}
                        <View style={styles.rowActionSpacer} />
                      </View>
                    )}
                    {block.rows.map((row, r) => (
                      <View key={r} style={{ flexDirection: 'row', backgroundColor: r % 2 ? theme.colors.surfaceAlt : theme.colors.surface }}>
                        {row.map((cell, c) => (
                          <TextInput
                            key={c}
                            value={cell}
                            onFocus={beginEdit}
                            onBlur={endEdit}
                            onChangeText={(t) => updateCell(bi, r, c, t)}
                            style={[styles.cell, { color: theme.colors.text, borderColor: theme.colors.border }]}
                          />
                        ))}
                        <Pressable onPress={() => deleteRow(bi, r)} style={styles.rowAction} hitSlop={6}>
                          <Ionicons name="remove-circle-outline" size={18} color={theme.colors.danger} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <Pressable onPress={() => addRow(bi)} style={[styles.addRow, { borderColor: theme.colors.border }]}>
                  <Ionicons name="add" size={16} color={theme.colors.accent} />
                  <Text variant="captionStrong" color="accent" style={{ marginLeft: 4 }}>
                    Add row
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        {/* Footer actions */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + theme.spacing.md, backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border },
          ]}
        >
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Export as…"
                icon="download-outline"
                variant="secondary"
                onPress={() => setShowExport(true)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Save" icon="checkmark" loading={saving} disabled={!doc.isDirty} onPress={persist} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Export format chooser */}
      <DialogBase visible={showExport} onClose={() => setShowExport(false)}>
        <Text variant="h3" center>
          Export as
        </Text>
        {isTableDoc && (
          <Text variant="caption" color="muted" center style={{ marginTop: 4 }}>
            Tables detected — Excel keeps them tidy.
          </Text>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20, justifyContent: 'center' }}>
          {OUTPUT_FORMATS.map((fmt) => (
            <Pressable
              key={fmt}
              onPress={() => reExport(fmt)}
              disabled={exporting !== null}
              style={[
                styles.exportOption,
                { borderColor: theme.colors.border, opacity: exporting && exporting !== fmt ? 0.5 : 1 },
              ]}
            >
              {exporting === fmt ? (
                <ActivityIndicator color={theme.colors.accent} />
              ) : (
                <FormatIcon format={fmt} size={38} />
              )}
              <Text variant="captionStrong" style={{ marginTop: 8 }}>
                {FORMAT_META[fmt].label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 12 }} />
        <Button label="Cancel" variant="ghost" onPress={() => setShowExport(false)} />
      </DialogBase>
    </Screen>
  );
}

function IconBtn({
  icon,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={{
        width: 38,
        height: 38,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Ionicons name={icon} size={18} color={theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    paddingVertical: 4,
  },
  blockInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cell: {
    width: 130,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCell: { fontWeight: '700' },
  exportOption: {
    width: 96,
    height: 96,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActionSpacer: { width: 34 },
  rowAction: { width: 34, alignItems: 'center', justifyContent: 'center' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    marginTop: 8,
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
