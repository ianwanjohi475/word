/** Persisted app settings + first-launch onboarding flag. */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OutputFormat } from '@/types';

export interface SettingsState {
  hydrated: boolean;
  onboardingComplete: boolean;
  defaultFormat: OutputFormat;
  /** OCR language hint shown in Settings (the model auto-detects regardless). */
  ocrLanguage: string;
  notificationsEnabled: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setDefaultFormat: (f: OutputFormat) => void;
  setOcrLanguage: (l: string) => void;
  setNotificationsEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      onboardingComplete: false,
      defaultFormat: 'word',
      ocrLanguage: 'Auto-detect',
      notificationsEnabled: true,
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () => set({ onboardingComplete: false }),
      setDefaultFormat: (f) => set({ defaultFormat: f }),
      setOcrLanguage: (l) => set({ ocrLanguage: l }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
    }),
    {
      name: 'converta-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        defaultFormat: s.defaultFormat,
        ocrLanguage: s.ocrLanguage,
        notificationsEnabled: s.notificationsEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete so the root layout can gate navigation.
        useSettingsStore.setState({ hydrated: true });
        void state;
      },
    }
  )
);
