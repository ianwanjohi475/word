/**
 * Visual PDF editor (web).
 *
 * Add text anywhere, white-out (erase) content, highlight, add/delete pages,
 * then save a new PDF — all on-device with pdf.js (render) + pdf-lib (write).
 * No API key.
 *
 * Interaction: tapping a tool drops the element in the middle of the page,
 * selected and ready to drag (robust — no reliance on web tap coordinates).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useConversionStore } from '@/store/useConversionStore';
import { loadPdfForEdit, savePdf, PDF_EDITOR_AVAILABLE } from '@/services/pdfEdit';
import type { EditorPage, Overlay } from '@/services/pdfEditTypes';
import { uid } from '@/utils/id';
import { stripExtension } from '@/utils/format';

const COLORS = ['#111827', '#E4483D', '#2E76E8', '#12A66F', '#E5942B', '#FFFFFF'];

export default function PdfEdit() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const asset = useConversionStore((s) => s.activeAsset());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [current, setCurrent] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [containerW, setContainerW] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!PDF_EDITOR_AVAILABLE) {
        setError('The PDF editor is available in the web app.');
        setLoading(false);
        return;
      }
      if (!asset || asset.sourceFormat !== 'pdf') {
        setError('Choose a PDF to edit.');
        setLoading(false);
        return;
      }
      try {
        const loaded = await loadPdfForEdit(asset.uri);
        setBytes(loaded.bytes);
        setPages(loaded.pages);
      } catch (e) {
        setError((e as Error).message || 'Could not open this PDF.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  const page = pages[current];
  const displayW = containerW;
  const displayH = page ? containerW * (page.height / page.width) : 0;

  const pageOverlays = overlays.filter((o) => page && o.pageId === page.id);
  const selected = overlays.find((o) => o.id === selectedId) ?? null;

  const updateOverlay = (id: string, patch: Partial<Overlay>) =>
    setOverlays((prev) => prev.map((o) => (o.id === id ? ({ ...o, ...patch } as Overlay) : o)));

  const removeOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const addTool = (type: 'text' | 'white' | 'highlight') => {
    if (!page) return;
    const id = uid('ov_');
    if (type === 'text') {
      setOverlays((prev) => [...prev, { id, pageId: page.id, type: 'text', x: 0.12, y: 0.14, size: 0.03, color: '#111827', text: 'New text' }]);
    } else if (type === 'white') {
      setOverlays((prev) => [...prev, { id, pageId: page.id, type: 'white', x: 0.3, y: 0.42, w: 0.4, h: 0.06, color: '#FFFFFF' }]);
    } else {
      setOverlays((prev) => [...prev, { id, pageId: page.id, type: 'highlight', x: 0.3, y: 0.42, w: 0.4, h: 0.05, color: '#FFE45C' }]);
    }
    setSelectedId(id);
  };

  const addBlankPage = () => {
    const ref = page ?? { width: 595, height: 842 };
    const newPage: EditorPage = { id: uid('pg_'), kind: 'blank', width: ref.width, height: ref.height };
    setPages((prev) => {
      const nextArr = [...prev];
      nextArr.splice(current + 1, 0, newPage);
      return nextArr;
    });
    setCurrent((c) => c + 1);
    setSelectedId(null);
  };

  const deletePage = () => {
    if (pages.length <= 1 || !page) return;
    const pid = page.id;
    setOverlays((prev) => prev.filter((o) => o.pageId !== pid));
    setPages((prev) => prev.filter((_, i) => i !== current));
    setCurrent((c) => Math.max(0, c - 1));
    setSelectedId(null);
  };

  const onSave = async () => {
    if (!bytes) return;
    setSaving(true);
    try {
      const name = `${stripExtension(asset?.name ?? 'document')} (edited).pdf`;
      await savePdf(bytes, pages, overlays, name);
      toast.show('Edited PDF downloaded', 'success');
    } catch (e) {
      toast.show((e as Error).message || 'Could not save the PDF.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen header={{ title: 'Edit PDF', showBack: true }}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text variant="caption" color="muted" style={{ marginTop: 12 }}>
            Opening PDF…
          </Text>
        </View>
      </Screen>
    );
  }

  if (error || !page) {
    return (
      <Screen header={{ title: 'Edit PDF', showBack: true }}>
        <View style={styles.center}>
          <Ionicons name="document-lock-outline" size={40} color={theme.colors.textFaint} />
          <Text variant="body" color="muted" center style={{ marginTop: 12, maxWidth: 300 }}>
            {error ?? 'Nothing to edit.'}
          </Text>
          {Platform.OS === 'web' && (
            <View style={{ marginTop: 18 }}>
              <Button label="Choose a PDF" onPress={() => router.replace('/upload')} fullWidth={false} />
            </View>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={{
        title: 'Edit PDF',
        showBack: true,
        right: (
          <Pressable onPress={onSave} hitSlop={8} disabled={saving} style={[styles.saveBtn, { backgroundColor: theme.colors.accent }]}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text variant="captionStrong" color="onAccent">Save</Text>}
          </Pressable>
        ),
      }}
    >
      {/* Page nav */}
      <View style={[styles.pageNav, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => { setCurrent((c) => Math.max(0, c - 1)); setSelectedId(null); }} disabled={current === 0} hitSlop={8} style={{ opacity: current === 0 ? 0.35 : 1 }}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="captionStrong">Page {current + 1} / {pages.length}</Text>
        <Pressable onPress={() => { setCurrent((c) => Math.min(pages.length - 1, c + 1)); setSelectedId(null); }} disabled={current === pages.length - 1} hitSlop={8} style={{ opacity: current === pages.length - 1 ? 0.35 : 1 }}>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={addBlankPage} hitSlop={8} style={styles.navAction}>
          <Ionicons name="add" size={18} color={theme.colors.accent} />
          <Text variant="micro" color="accent">PAGE</Text>
        </Pressable>
        <Pressable onPress={deletePage} hitSlop={8} style={styles.navAction} disabled={pages.length <= 1}>
          <Ionicons name="trash-outline" size={16} color={pages.length <= 1 ? theme.colors.textFaint : theme.colors.danger} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View onLayout={(e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width)}>
          {displayW > 0 && (
            <View style={[styles.pageWrap, { width: displayW, height: displayH, borderColor: theme.colors.border }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedId(null)}>
                {page.kind === 'orig' && page.dataUrl ? (
                  <Image source={{ uri: page.dataUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                ) : (
                  <View style={{ flex: 1, backgroundColor: '#fff' }} />
                )}
              </Pressable>

              {pageOverlays.map((ov) => (
                <DraggableOverlay
                  key={ov.id}
                  overlay={ov}
                  displayW={displayW}
                  displayH={displayH}
                  selected={selectedId === ov.id}
                  onSelect={() => setSelectedId(ov.id)}
                  onMove={(x, y) => updateOverlay(ov.id, { x, y })}
                  accent={theme.colors.accent}
                />
              ))}
            </View>
          )}
        </View>
        <Text variant="caption" color="muted" center style={{ marginTop: 12 }}>
          Add items with the tools below, then drag to position. Tap an item to edit it.
        </Text>
      </ScrollView>

      {/* Selected overlay controls */}
      {selected && (
        <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          {selected.type === 'text' ? (
            <>
              <TextInput
                value={selected.text}
                onChangeText={(t) => updateOverlay(selected.id, { text: t })}
                placeholder="Type text…"
                placeholderTextColor={theme.colors.textFaint}
                multiline
                style={[styles.textInput, { color: theme.colors.text, backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
              />
              <View style={styles.panelRow}>
                <StepBtn icon="remove" onPress={() => updateOverlay(selected.id, { size: Math.max(0.012, selected.size - 0.005) })} />
                <Text variant="captionStrong" style={{ marginHorizontal: 8 }}>Size</Text>
                <StepBtn icon="add" onPress={() => updateOverlay(selected.id, { size: Math.min(0.14, selected.size + 0.005) })} />
                <View style={{ width: 12 }} />
                {COLORS.map((c) => (
                  <Pressable key={c} onPress={() => updateOverlay(selected.id, { color: c })} style={[styles.swatch, { backgroundColor: c, borderColor: selected.color === c ? theme.colors.accent : theme.colors.border, borderWidth: selected.color === c ? 2 : 1 }]} />
                ))}
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => removeOverlay(selected.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.panelRow}>
              <Text variant="captionStrong">Width</Text>
              <StepBtn icon="remove" onPress={() => updateOverlay(selected.id, { w: Math.max(0.05, (selected as { w: number }).w - 0.03) })} />
              <StepBtn icon="add" onPress={() => updateOverlay(selected.id, { w: Math.min(1, (selected as { w: number }).w + 0.03) })} />
              <View style={{ width: 10 }} />
              <Text variant="captionStrong">Height</Text>
              <StepBtn icon="remove" onPress={() => updateOverlay(selected.id, { h: Math.max(0.02, (selected as { h: number }).h - 0.02) })} />
              <StepBtn icon="add" onPress={() => updateOverlay(selected.id, { h: Math.min(1, (selected as { h: number }).h + 0.02) })} />
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => removeOverlay(selected.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Tool bar */}
      <View style={[styles.toolbar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {([
          { key: 'text', icon: 'text', label: 'Add text' },
          { key: 'white', icon: 'scan-outline', label: 'Erase' },
          { key: 'highlight', icon: 'color-fill', label: 'Highlight' },
        ] as { key: 'text' | 'white' | 'highlight'; icon: keyof typeof Ionicons.glyphMap; label: string }[]).map((t) => (
          <Pressable key={t.key} onPress={() => addTool(t.key)} style={styles.tool}>
            <View style={[styles.toolChip, { backgroundColor: theme.colors.accentSoft }]}>
              <Ionicons name={t.icon} size={20} color={theme.colors.accent} />
            </View>
            <Text variant="micro" color="muted" style={{ marginTop: 4 }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function StepBtn({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceAlt, marginHorizontal: 3 }}>
      <Ionicons name={icon} size={16} color={theme.colors.text} />
    </Pressable>
  );
}

interface DragProps {
  overlay: Overlay;
  displayW: number;
  displayH: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  accent: string;
}

function DraggableOverlay(props: DragProps) {
  const { overlay, displayW, displayH, selected, accent } = props;
  // Keep the latest props in a ref so the (once-created) PanResponder handlers
  // never use stale values.
  const ref = useRef(props);
  ref.current = props;
  const start = useRef({ x: 0, y: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        ref.current.onSelect();
        start.current = { x: ref.current.overlay.x, y: ref.current.overlay.y };
      },
      onPanResponderMove: (_e, g) => {
        const p = ref.current;
        const nx = Math.min(1, Math.max(0, start.current.x + g.dx / p.displayW));
        const ny = Math.min(1, Math.max(0, start.current.y + g.dy / p.displayH));
        p.onMove(nx, ny);
      },
    })
  ).current;

  const left = overlay.x * displayW;
  const top = overlay.y * displayH;

  if (overlay.type === 'text') {
    const fontSize = overlay.size * displayH;
    return (
      <View {...pan.panHandlers} style={[styles.overlayBase, { left, top, borderColor: selected ? accent : 'transparent', borderWidth: selected ? 1.5 : 0, paddingHorizontal: 2 }]}>
        <Text style={{ fontSize, lineHeight: fontSize * 1.25, color: overlay.color }}>{overlay.text || ' '}</Text>
      </View>
    );
  }

  return (
    <View
      {...pan.panHandlers}
      style={[
        styles.overlayBase,
        {
          left,
          top,
          width: overlay.w * displayW,
          height: overlay.h * displayH,
          backgroundColor: overlay.type === 'highlight' ? 'rgba(255,228,92,0.45)' : '#FFFFFF',
          borderColor: selected ? accent : overlay.type === 'white' ? '#D7DBE0' : 'transparent',
          borderWidth: selected ? 1.5 : overlay.type === 'white' ? 1 : 0,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  saveBtn: { paddingHorizontal: 16, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8 },
  pageWrap: { borderWidth: 1, borderRadius: 6, overflow: 'hidden', backgroundColor: '#fff', alignSelf: 'center' },
  overlayBase: { position: 'absolute', borderRadius: 2, minWidth: 12, minHeight: 12 },
  panel: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12 },
  panelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 4 },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, minHeight: 40 },
  swatch: { width: 24, height: 24, borderRadius: 12, marginHorizontal: 2 },
  toolbar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10, paddingHorizontal: 8 },
  tool: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolChip: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
