/** Bottom tabs with a premium floating bar + active pill (Home, Files, History, Settings). */
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { on: 'home', off: 'home-outline', label: 'Home' },
  files: { on: 'folder-open', off: 'folder-outline', label: 'Files' },
  history: { on: 'time', off: 'time-outline', label: 'History' },
  settings: { on: 'settings', off: 'settings-outline', label: 'Settings' },
};

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

function TabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || 12 }]} pointerEvents="box-none">
      <View style={[styles.bar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.lg]}>
        {state.routes.map((route, index) => {
          const meta = ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === index;

          const onPress = () => {
            Haptics.selectionAsync().catch(() => {});
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              <View
                style={[
                  styles.pill,
                  focused && { backgroundColor: theme.colors.accent },
                ]}
              >
                <Ionicons
                  name={focused ? meta.on : meta.off}
                  size={20}
                  color={focused ? '#fff' : theme.colors.textFaint}
                />
                {focused && (
                  <Text variant="captionStrong" color="onAccent" style={{ marginLeft: 7 }}>
                    {meta.label}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...(props as unknown as TabBarProps)} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="files" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
    maxWidth: 460,
  },
  item: { flex: 1, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
});
