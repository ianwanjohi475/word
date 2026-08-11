/** Compact pill used for format-support chips and filters. */
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'neutral' | 'accent';
  style?: ViewStyle;
}

export function Chip({ label, selected, onPress, icon, tone = 'neutral', style }: Props) {
  const theme = useTheme();
  const active = selected;
  const bg = active
    ? tone === 'accent'
      ? theme.colors.accent
      : theme.colors.accentSoft
    : theme.colors.surfaceAlt;
  const fg = active ? (tone === 'accent' ? theme.colors.onAccent : theme.colors.accent) : theme.colors.textMuted;

  const inner = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.pill,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: active ? 'transparent' : theme.colors.border,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={14} color={fg} style={{ marginRight: 6 }} />}
      <Text variant="captionStrong" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return inner;
  return <Pressable onPress={onPress}>{inner}</Pressable>;
}
