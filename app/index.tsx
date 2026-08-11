/** Entry redirect: onboarding on first launch, otherwise the tab dashboard. */
import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function Index() {
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  return <Redirect href={onboardingComplete ? '/(tabs)' : '/onboarding'} />;
}
