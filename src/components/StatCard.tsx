/** Compact colorful stat card for the Home dashboard strip. */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface Props {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string; // base color
  softBg: string;
}

export function StatCard({ value, label, icon, tint, softBg }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.sm]}>
      <View style={[styles.chip, { backgroundColor: softBg }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text variant="h2" style={{ marginTop: 10 }}>
        {value}
      </Text>
      <Text variant="micro" color="muted" numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  chip: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
