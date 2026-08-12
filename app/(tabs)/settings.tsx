/** Settings: account, appearance (light/dark), defaults, storage, privacy, support, about. */
import React, { useCallback, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormatIcon } from '@/components/FormatIcon';
import { DialogBase, ConfirmDialog } from '@/components/Dialog';
import { useToast } from '@/components/Toast';
import { useSettingsStore, type ThemeMode } from '@/store/useSettingsStore';
import { storageUsage, clearCache } from '@/services/io';
import { hasApiKey, GROQ_MODEL } from '@/config';
import { OUTPUT_FORMATS, FORMAT_META } from '@/utils/formats';
import { formatBytes } from '@/utils/format';
import type { OutputFormat } from '@/types';

const SUPPORT_PHONE = '0758950370';
const SUPPORT_EMAIL = 'ianwanjohi475@gmail.com';
const LANGUAGES = ['Auto-detect', 'English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Arabic', 'Hindi'];

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

function Row({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          backgroundColor: pressed && onPress ? theme.colors.surfaceAlt : 'transparent',
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? theme.colors.accent) + '22' }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? theme.colors.accent} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text variant="bodyStrong">{title}</Text>
        {!!subtitle && (
          <Text variant="caption" color="muted" style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} /> : null)}
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="captionStrong" color="muted" style={{ marginBottom: 8, marginTop: theme.spacing.xxl, marginLeft: 4 }}>
      {children.toUpperCase()}
    </Text>
  );
}

export default function Settings() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const defaultFormat = useSettingsStore((s) => s.defaultFormat);
  const setDefaultFormat = useSettingsStore((s) => s.setDefaultFormat);
  const ocrLanguage = useSettingsStore((s) => s.ocrLanguage);
  const setOcrLanguage = useSettingsStore((s) => s.setOcrLanguage);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const resetOnboarding = useSettingsStore((s) => s.resetOnboarding);

  const [usage, setUsage] = useState<number | null>(null);
  const [showFormat, setShowFormat] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [confirmClearCache, setConfirmClearCache] = useState(false);

  useFocusEffect(
    useCallback(() => {
      storageUsage().then(setUsage).catch(() => setUsage(0));
    }, [])
  );

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.show('Could not open that on this device.', 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="h1">Settings</Text>

        {/* Account (placeholder) */}
        <SectionLabel>Account</SectionLabel>
        <Card padded>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.accentSoft }]}>
              <Ionicons name="person" size={26} color={theme.colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text variant="h3">Guest</Text>
              <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                Local account · no sign-in required
              </Text>
            </View>
          </View>
          <View style={{ height: 14 }} />
          <Button
            label="Manage account"
            variant="secondary"
            size="md"
            onPress={() => toast.show('Accounts are a placeholder — everything stays on your device.', 'info')}
          />
        </Card>

        {/* Appearance */}
        <SectionLabel>Appearance</SectionLabel>
        <Card padded>
          <Text variant="bodyStrong" style={{ marginBottom: 10 }}>
            Theme
          </Text>
          <View style={[styles.segment, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setThemeMode(opt.key)}
                  style={[styles.segmentItem, active && { backgroundColor: theme.colors.surface }, active && theme.shadows.sm]}
                >
                  <Ionicons name={opt.icon} size={16} color={active ? theme.colors.accent : theme.colors.textMuted} />
                  <Text variant="captionStrong" color={active ? 'accent' : 'muted'} style={{ marginTop: 4 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Conversion */}
        <SectionLabel>Conversion</SectionLabel>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <Row
            icon="document-text-outline"
            title="Default format"
            subtitle={FORMAT_META[defaultFormat].label}
            onPress={() => setShowFormat(true)}
          />
          <Row icon="language-outline" title="OCR language" subtitle={ocrLanguage} onPress={() => setShowLang(true)} last />
        </Card>

        {/* Storage */}
        <SectionLabel>Storage</SectionLabel>
        <Card padded>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.rowIcon, { backgroundColor: theme.colors.info + '22' }]}>
              <Ionicons name="save-outline" size={18} color={theme.colors.info} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="bodyStrong">Files on device</Text>
              <Text variant="caption" color="muted">
                {usage === null ? 'Calculating…' : `${formatBytes(usage)} used by converted files`}
              </Text>
            </View>
          </View>
          <View style={{ height: 14 }} />
          <Button label="Clear cache" variant="secondary" size="md" icon="refresh-outline" onPress={() => setConfirmClearCache(true)} />
        </Card>

        {/* AI & Privacy */}
        <SectionLabel>AI & Privacy</SectionLabel>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <Row
            icon="hardware-chip-outline"
            title="OCR engine"
            subtitle={`Groq · ${hasApiKey() ? 'API key configured' : 'No API key'}`}
            right={<View style={[styles.dot, { backgroundColor: hasApiKey() ? theme.colors.success : theme.colors.danger }]} />}
          />
          <Row icon="shield-checkmark-outline" iconColor={theme.colors.success} title="Privacy" subtitle="How your data is handled" onPress={() => setShowPrivacy(true)} last />
        </Card>

        {/* Support */}
        <SectionLabel>Support</SectionLabel>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <Row icon="help-buoy-outline" title="Help & Support" subtitle="Call or email us" onPress={() => setShowSupport(true)} />
          <Row icon="information-circle-outline" title="About" subtitle={`Version ${version}`} onPress={() => setShowAbout(true)} last />
        </Card>

        <Pressable onPress={resetOnboarding} style={{ alignSelf: 'center', marginTop: theme.spacing.xxl, padding: 6 }}>
          <Text variant="caption" color="faint">
            Replay onboarding
          </Text>
        </Pressable>
        <Text variant="captionStrong" color="muted" center style={{ marginTop: 8 }}>
          Proudly powered by ian_ke
        </Text>
      </ScrollView>

      {/* Default format picker */}
      <DialogBase visible={showFormat} onClose={() => setShowFormat(false)}>
        <Text variant="h3" center style={{ marginBottom: 16 }}>
          Default format
        </Text>
        {OUTPUT_FORMATS.map((fmt: OutputFormat) => (
          <Pressable
            key={fmt}
            onPress={() => {
              setDefaultFormat(fmt);
              setShowFormat(false);
            }}
            style={[styles.pickRow, { borderColor: theme.colors.border }]}
          >
            <FormatIcon format={fmt} size={30} />
            <Text variant="bodyStrong" style={{ flex: 1, marginLeft: 12 }}>
              {FORMAT_META[fmt].label}
            </Text>
            {defaultFormat === fmt && <Ionicons name="checkmark-circle" size={22} color={theme.colors.accent} />}
          </Pressable>
        ))}
      </DialogBase>

      {/* OCR language picker */}
      <DialogBase visible={showLang} onClose={() => setShowLang(false)}>
        <Text variant="h3" center style={{ marginBottom: 6 }}>
          OCR language
        </Text>
        <Text variant="caption" color="muted" center style={{ marginBottom: 14 }}>
          The engine auto-detects language; this is a hint.
        </Text>
        <ScrollView style={{ maxHeight: 320 }}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang}
              onPress={() => {
                setOcrLanguage(lang);
                setShowLang(false);
              }}
              style={[styles.langRow, { borderColor: theme.colors.border }]}
            >
              <Text variant="body" style={{ flex: 1 }}>
                {lang}
              </Text>
              {ocrLanguage === lang && <Ionicons name="checkmark" size={20} color={theme.colors.accent} />}
            </Pressable>
          ))}
        </ScrollView>
      </DialogBase>

      {/* Support */}
      <DialogBase visible={showSupport} onClose={() => setShowSupport(false)}>
        <View style={[styles.aboutIcon, { backgroundColor: theme.colors.accentSoft }]}>
          <Ionicons name="help-buoy" size={28} color={theme.colors.accent} />
        </View>
        <Text variant="h3" center>
          Help & Support
        </Text>
        <Text variant="body" color="muted" center style={{ marginTop: 8, marginBottom: 18 }}>
          We're here to help. Reach us any time:
        </Text>
        <Button label={`Call ${SUPPORT_PHONE}`} icon="call-outline" onPress={() => openLink(`tel:${SUPPORT_PHONE}`)} />
        <View style={{ height: 10 }} />
        <Button
          label="Email support"
          icon="mail-outline"
          variant="secondary"
          onPress={() => openLink(`mailto:${SUPPORT_EMAIL}?subject=Converta%20Support`)}
        />
        <Text variant="caption" color="muted" center style={{ marginTop: 12 }}>
          {SUPPORT_EMAIL}
        </Text>
        <View style={{ height: 12 }} />
        <Button label="Close" variant="ghost" onPress={() => setShowSupport(false)} />
      </DialogBase>

      {/* Privacy */}
      <DialogBase visible={showPrivacy} onClose={() => setShowPrivacy(false)}>
        <View style={[styles.aboutIcon, { backgroundColor: theme.colors.successSoft }]}>
          <Ionicons name="shield-checkmark" size={28} color={theme.colors.success} />
        </View>
        <Text variant="h3" center>
          Your data stays yours
        </Text>
        <Text variant="body" color="muted" style={{ marginTop: 12 }}>
          Converta is local-first. Your files, history and generated documents live only on this device — there is no account and no server of ours.
        </Text>
        <Text variant="body" color="muted" style={{ marginTop: 10 }}>
          To read a document, its image is sent directly to Groq's OCR API for text extraction, then discarded. Nothing else leaves your device.
        </Text>
        <View style={{ height: 18 }} />
        <Button label="Got it" onPress={() => setShowPrivacy(false)} />
      </DialogBase>

      {/* About */}
      <DialogBase visible={showAbout} onClose={() => setShowAbout(false)}>
        <View style={[styles.aboutIcon, { backgroundColor: theme.colors.accentSoft }]}>
          <Ionicons name="documents" size={28} color={theme.colors.accent} />
        </View>
        <Text variant="h2" center>
          Converta
        </Text>
        <Text variant="caption" color="muted" center style={{ marginTop: 4 }}>
          Version {version} · Model {GROQ_MODEL}
        </Text>
        <Text variant="body" color="muted" center style={{ marginTop: 14 }}>
          Turn any document into editable Word, Excel, PDF or text files with AI-powered OCR.
        </Text>
        <Text variant="captionStrong" color="accent" center style={{ marginTop: 14 }}>
          Proudly powered by ian_ke
        </Text>
        <View style={{ height: 16 }} />
        <Button label="Close" variant="secondary" onPress={() => setShowAbout(false)} />
      </DialogBase>

      <ConfirmDialog
        visible={confirmClearCache}
        title="Clear cache?"
        message="This removes temporary working files (imported originals and rendered PDF pages). Your converted files are kept."
        confirmLabel="Clear cache"
        icon="refresh-outline"
        onConfirm={async () => {
          await clearCache();
          setConfirmClearCache(false);
          storageUsage().then(setUsage);
          toast.show('Cache cleared', 'success');
        }}
        onCancel={() => setConfirmClearCache(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  segment: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  segmentItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aboutIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
});
