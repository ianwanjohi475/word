/** Upload screen: choose files/gallery/camera, review the multi-file selection. */
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { SourceGlyph } from '@/components/FormatIcon';
import { useToast } from '@/components/Toast';
import { useConversionStore } from '@/store/useConversionStore';
import { pickDocuments, PickerCancelled, PermissionDenied } from '@/services/picker';
import { formatBytes } from '@/utils/format';
import { sourceFormatLabel } from '@/utils/formats';
import type { OutputFormat, SourceAsset } from '@/types';

const SUPPORT = ['PDF', 'DOCX', 'XLSX', 'CSV'];

export default function Upload() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ target?: OutputFormat }>();

  const assets = useConversionStore((s) => s.assets);
  const addAssets = useConversionStore((s) => s.addAssets);
  const setAssets = useConversionStore((s) => s.setAssets);
  const removeAsset = useConversionStore((s) => s.removeAsset);
  const setCurrentDoc = useConversionStore((s) => s.setCurrentDoc);
  const [busy, setBusy] = useState(false);

  const handle = async (fn: () => Promise<SourceAsset[]>) => {
    setBusy(true);
    try {
      const picked = await fn();
      setCurrentDoc(null);
      if (assets.length === 0) setAssets(picked);
      else addAssets(picked);
    } catch (e) {
      if (e instanceof PickerCancelled) return;
      if (e instanceof PermissionDenied) toast.show(e.message, 'error');
      else toast.show('Could not open that file.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const proceed = () => {
    router.push({ pathname: '/convert', params: params.target ? { target: params.target } : {} });
  };

  const actions: { key: string; icon: keyof typeof Ionicons.glyphMap; label: string; fn: () => void }[] = [
    { key: 'files', icon: 'folder-outline', label: 'Choose from Files', fn: () => handle(pickDocuments) },
  ];

  return (
    <Screen header={{ title: 'Upload', showBack: true }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Drop area */}
        <Pressable onPress={() => handle(pickDocuments)}>
          <View
            style={[
              styles.dropZone,
              { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentSoft },
            ]}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              <Ionicons name="cloud-upload-outline" size={30} color={theme.colors.accent} />
            </View>
            <Text variant="h3">Add your documents</Text>
            <Text variant="caption" color="muted" center style={{ marginTop: 4, maxWidth: 260 }}>
              Tap to browse files, or use an option below. You can add several at once.
            </Text>
          </View>
        </Pressable>

        {/* Format support chips */}
        <View style={styles.chips}>
          {SUPPORT.map((s) => (
            <Chip key={s} label={s} />
          ))}
        </View>

        {/* Actions */}
        <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          {actions.map((a) => (
            <Card key={a.key} onPress={a.fn} haptic disabled={busy}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: theme.colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={a.icon} size={22} color={theme.colors.accent} />
                </View>
                <Text variant="bodyStrong" style={{ flex: 1, marginLeft: theme.spacing.md }}>
                  {a.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
              </View>
            </Card>
          ))}
        </View>

        {/* Selected files */}
        {assets.length > 0 && (
          <View style={{ marginTop: theme.spacing.xxl }}>
            <Text variant="captionStrong" color="muted" style={{ marginBottom: theme.spacing.sm }}>
              SELECTED ({assets.length})
            </Text>
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {assets.map((a, i) => (
                <View
                  key={a.id}
                  style={[
                    styles.fileItem,
                    {
                      borderBottomWidth: i === assets.length - 1 ? 0 : StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <SourceGlyph format={a.sourceFormat} size={22} />
                  <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text variant="caption" color="muted">
                      {sourceFormatLabel(a.sourceFormat)} · {formatBytes(a.size)}
                    </Text>
                  </View>
                  <Pressable hitSlop={10} onPress={() => removeAsset(a.id)}>
                    <Ionicons name="close-circle" size={22} color={theme.colors.textFaint} />
                  </Pressable>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>

      {assets.length > 0 && (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + theme.spacing.md, backgroundColor: theme.colors.bg, borderTopColor: theme.colors.border },
          ]}
        >
          <Button
            label={assets.length > 1 ? `Continue with ${assets.length} files` : 'Continue'}
            iconRight="arrow-forward"
            gradient
            onPress={proceed}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  fileItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
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
