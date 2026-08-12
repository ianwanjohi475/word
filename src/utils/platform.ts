import { Platform } from 'react-native';

/**
 * Web has no native animation driver, so `useNativeDriver: true` there logs a
 * warning and falls back to JS anyway. Use this flag so animations opt into the
 * native driver only where it exists.
 */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
