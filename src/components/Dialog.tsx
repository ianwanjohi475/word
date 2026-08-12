/** Modal dialogs: a base sheet, a confirm dialog, and a text-prompt dialog. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { USE_NATIVE_DRIVER } from '@/utils/platform';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Button } from './Button';

interface BaseProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function DialogBase({ visible, onClose, children }: BaseProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(translate, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER, speed: 18, bounciness: 4 }),
      ]).start();
    } else {
      opacity.setValue(0);
      translate.setValue(20);
    }
  }, [visible, opacity, translate]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { backgroundColor: theme.colors.overlay, opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              transform: [{ translateY: translate }],
            },
            theme.shadows.lg,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

interface ConfirmProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  icon,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const theme = useTheme();
  return (
    <DialogBase visible={visible} onClose={onCancel}>
      {icon && (
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: destructive ? theme.colors.dangerSoft : theme.colors.accentSoft },
          ]}
        >
          <Ionicons name={icon} size={26} color={destructive ? theme.colors.danger : theme.colors.accent} />
        </View>
      )}
      <Text variant="h3" center>
        {title}
      </Text>
      {!!message && (
        <Text variant="body" color="muted" center style={{ marginTop: 8 }}>
          {message}
        </Text>
      )}
      <View style={{ height: theme.spacing.xl }} />
      <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
      <View style={{ height: theme.spacing.sm }} />
      <Button label={cancelLabel} variant="ghost" onPress={onCancel} />
    </DialogBase>
  );
}

interface PromptProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  visible,
  title,
  initialValue = '',
  placeholder,
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
}: PromptProps) {
  const theme = useTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <DialogBase visible={visible} onClose={onCancel}>
      <Text variant="h3" center>
        {title}
      </Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textFaint}
        autoFocus
        selectTextOnFocus
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
      />
      <Button
        label={confirmLabel}
        onPress={() => onConfirm(value.trim())}
        disabled={value.trim().length === 0}
      />
      <View style={{ height: theme.spacing.sm }} />
      <Button label="Cancel" variant="ghost" onPress={onCancel} />
    </DialogBase>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginVertical: 18,
  },
});
