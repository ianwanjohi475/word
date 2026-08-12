/** Lightweight toast system exposed via a context hook: `useToast().show(...)`. */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';

type ToastKind = 'success' | 'error' | 'info';
interface ToastData {
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }).start(() =>
      setToast(null)
    );
  }, [translateY]);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, kind });
      translateY.setValue(-120);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER, speed: 16, bounciness: 6 }).start();
      timer.current = setTimeout(hide, 2600);
    },
    [hide, translateY]
  );

  const iconFor: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    info: 'information-circle',
  };
  const colorFor: Record<ToastKind, string> = {
    success: theme.colors.success,
    error: theme.colors.danger,
    info: theme.colors.accent,
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.wrap,
            { top: insets.top + 8, transform: [{ translateY }], pointerEvents: 'none' },
          ]}
        >
          <View
            style={[
              styles.toast,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.md,
            ]}
          >
            <Ionicons name={iconFor[toast.kind]} size={20} color={colorFor[toast.kind]} />
            <Text variant="bodyStrong" style={{ marginLeft: 10, flex: 1 }} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
