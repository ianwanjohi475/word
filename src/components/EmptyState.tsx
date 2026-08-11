/** Friendly empty-state block with an icon, title, message and optional CTA. */
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Button } from './Button';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({ icon = 'sparkles-outline', title, message, actionLabel, onAction, compact }: Props) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: compact ? theme.spacing.xxl : theme.spacing.giant, paddingHorizontal: theme.spacing.xl }}>
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 24,
          backgroundColor: theme.colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.lg,
        }}
      >
        <Ionicons name={icon} size={34} color={theme.colors.accent} />
      </View>
      <Text variant="h3" center>
        {title}
      </Text>
      {!!message && (
        <Text variant="body" color="muted" center style={{ marginTop: 6, maxWidth: 300 }}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={{ marginTop: theme.spacing.xl, minWidth: 200 }}>
          <Button label={actionLabel} onPress={onAction} size="md" fullWidth={false} />
        </View>
      )}
    </View>
  );
}
