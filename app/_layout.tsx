// Polyfills MUST load before any file-generation library is imported anywhere.
import '@/polyfills';

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { ToastProvider } from '@/components/Toast';
import { PdfRasterizerHost } from '@/components/PdfRasterizerHost';
import { BrandedSplash } from '@/components/BrandedSplash';
import { initDatabase } from '@/db/database';
import { ensureDirs } from '@/services/files';
import { setupPwa } from '@/services/pwa';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const theme = useTheme();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const [ready, setReady] = useState(false);
  const [showBrand, setShowBrand] = useState(true);

  useEffect(() => {
    setupPwa();
    (async () => {
      try {
        await Promise.all([initDatabase(), ensureDirs()]);
      } catch {
        // Non-fatal: the app can still render error states.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (ready && hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [ready, hydrated]);

  if (!ready || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="upload" options={{ presentation: 'card' }} />
            <Stack.Screen name="scan" options={{ animation: 'fade' }} />
            <Stack.Screen name="convert" />
            <Stack.Screen name="processing" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="result" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="editor" options={{ presentation: 'card' }} />
          </Stack>
          {/* Off-screen PDF renderer (native only — WebView has no web build). */}
          {Platform.OS !== 'web' && <PdfRasterizerHost />}
          {/* Branded launch overlay with the "powered by ian_ke" credit. */}
          {showBrand && <BrandedSplash onDone={() => setShowBrand(false)} />}
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
