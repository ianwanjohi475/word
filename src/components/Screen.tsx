/** Screen scaffold: themed background, safe-area, and an optional nav header. */
import React from 'react';
import { View, Pressable, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack, onBack, right }: HeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.header, { paddingHorizontal: theme.spacing.xl }]}>
      <View style={styles.headerSide}>
        {showBack && (
          <Pressable
            hitSlop={10}
            onPress={() => (onBack ? onBack() : router.back())}
            style={[
              styles.backBtn,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
        )}
      </View>
      <View style={styles.headerCenter}>
        {!!title && (
          <Text variant="h3" numberOfLines={1}>
            {title}
          </Text>
        )}
        {!!subtitle && (
          <Text variant="caption" color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.headerSide, styles.headerRight]}>{right}</View>
    </View>
  );
}

interface ScreenProps {
  children: React.ReactNode;
  header?: HeaderProps;
  /** When true, disables top safe-area padding (e.g. for full-bleed content). */
  edgeToEdge?: boolean;
  bg?: 'bg' | 'surface';
}

export function Screen({ children, header, edgeToEdge, bg = 'bg' }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors[bg] }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={{ paddingTop: edgeToEdge ? 0 : insets.top + (Platform.OS === 'android' ? 6 : 0), flex: 1 }}>
        {header && <ScreenHeader {...header} />}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 6,
  },
  headerSide: { width: 44, justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end' },
  headerCenter: { flex: 1, alignItems: 'center' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
