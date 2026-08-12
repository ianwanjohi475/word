/** Settings: account placeholder, defaults, language, storage, privacy, about. */
import React, { useCallback, useState } from 'react';
import { View, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
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
import { useSettingsStore } from '@/store/useSettingsStore';
import { storageUsage, clearCache } from '@/services/io';
import { hasApiKey, GROQ_MODEL } from '@/config';
import { OUTPUT_FORMATS, FORMAT_META } from '@/utils/formats';
import { formatBytes } from '@/utils/format';
import type { OutputFormat } from '@/types';

const LANGUAGES = ['Auto-detect', 'English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Arabic', 'Hindi'];

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
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? theme.colors.accent) + '18' }]}>
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
  const notifications = useSettingsStore((s) => s.notificationsEnabled);
  const setNotifications = useSettingsStore((s) => s.setNotificationsEnabled);
  const resetOnboarding = useSettingsStore((s) => s.resetOnboarding);

  const [usage, setUsage] = useState<number | null>(null);
  const [showFormat, setShowFormat] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [confirmClearCache, setConfirmClearCache] = useState(false);

  useFocusEffect(
    useCallback(() => {
      storageUsage().then(setUsage).catch(() => setUsage(0));
    }, [])
  );

  const version = Constants.expoConfig?.version ?? '1.0.0';

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

        {/* Conversion */}
        <SectionLabel>Conversion</SectionLabel>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <Row
            icon="document-text-outline"
            title="Default format"
            subtitle={FORMAT_META[defaultFormat].label}
            onPress={() => setShowFormat(true)}
          />
          <Row
            icon="language-outline"
            title="OCR language"
            subtitle={ocrLanguage}
            onPress={() => setShowLang(true)}
            last
          />
        </Card>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <Row
            icon="notifications-outline"
            iconColor={theme.colors.warning}
            title="Notifications"
            subtitle="Alerts when conversions finish"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ true: theme.colors.accent, false: theme.colors.borderStrong }}
                thumbColor="#fff"
              />
            }
            last
          />
        </Card>

        {/* Storage */}
        <SectionLabel>Storage</SectionLabel>
        <Card padded>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.rowIcon, { backgroundColor: theme.colors.info + '18' }]}>
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
            right={
              <View style={[styles.dot, { backgroundColor: hasApiKey() ? theme.colors.success : theme.colors.danger }]} />
            }
          />
          <Row icon="shield-checkmark-outline" iconColor={theme.colors.success} title="Privacy" subtitle="How your data is handled" onPress={() => setShowPrivacy(true)} last />
        </Card>

        {/* Support */}
        <SectionLabel>Support</SectionLabel>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <Row
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => toast.show('Support: help@converta.app', 'info')}
          />
          <Row icon="information-circle-outline" title="About" subtitle={`Version ${version}`} onPress={() => setShowAbout(true)} last />
        </Card>

        <Pressable onPress={resetOnboarding} style={{ alignSelf: 'center', marginTop: theme.spacing.xxl, padding: 8 }}>
          <Text variant="caption" color="faint">
            Replay onboarding
          </Text>
        </Pressable>
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
        <View style={{ height: 18 }} />
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
