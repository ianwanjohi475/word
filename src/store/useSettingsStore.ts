/** Persisted app settings + first-launch onboarding flag. */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OutputFormat } from '@/types';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface SettingsState {
  hydrated: boolean;
  onboardingComplete: boolean;
  defaultFormat: OutputFormat;
  /** OCR language hint shown in Settings (the model auto-detects regardless). */
  ocrLanguage: string;
  themeMode: ThemeMode;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setDefaultFormat: (f: OutputFormat) => void;
  setOcrLanguage: (l: string) => void;
  setThemeMode: (m: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      onboardingComplete: false,
      defaultFormat: 'word',
      ocrLanguage: 'Auto-detect',
      themeMode: 'system',
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () => set({ onboardingComplete: false }),
      setDefaultFormat: (f) => set({ defaultFormat: f }),
      setOcrLanguage: (l) => set({ ocrLanguage: l }),
      setThemeMode: (m) => set({ themeMode: m }),
    }),
    {
      name: 'converta-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        defaultFormat: s.defaultFormat,
        ocrLanguage: s.ocrLanguage,
        themeMode: s.themeMode,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete so the root layout can gate navigation.
        useSettingsStore.setState({ hydrated: true });
        void state;
      },
    }
  )
);
