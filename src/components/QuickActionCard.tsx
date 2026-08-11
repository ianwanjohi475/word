/** Quick-conversion card (Image→Word, PDF→Excel, …) for the Home dashboard. */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Card } from './Card';
import { FormatIcon, SourceGlyph } from './FormatIcon';
import type { OutputFormat, SourceFormat } from '@/types';
import { FORMAT_META, sourceFormatLabel } from '@/utils/formats';

interface Props {
  source: SourceFormat;
  target: OutputFormat;
  onPress: () => void;
}

export function QuickActionCard({ source, target, onPress }: Props) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} haptic elevation="sm" padded={false} style={styles.card}>
      <View style={{ padding: theme.spacing.lg }}>
        <View style={styles.row}>
          <View
            style={[
              styles.sourceBadge,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}
          >
            <SourceGlyph format={source} size={22} />
          </View>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.textFaint} style={{ marginHorizontal: 8 }} />
          <FormatIcon format={target} size={34} />
        </View>
        <Text variant="bodyStrong" style={{ marginTop: theme.spacing.md }}>
          {sourceFormatLabel(source)} → {FORMAT_META[target].label}
        </Text>
        <Text variant="caption" color="muted" numberOfLines={1} style={{ marginTop: 2 }}>
          {FORMAT_META[target].badge} output
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  sourceBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
