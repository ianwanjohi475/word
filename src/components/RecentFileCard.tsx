/** Compact vertical card for the Home "Recent files" horizontal row. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Card } from './Card';
import { FormatIcon } from './FormatIcon';
import type { FileRecord } from '@/types';
import { formatBytes, formatRelativeDate } from '@/utils/format';

export function RecentFileCard({ record, onPress }: { record: FileRecord; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} haptic style={{ width: 148 }} padded>
      <View style={{ alignItems: 'flex-start' }}>
        <FormatIcon format={record.outputFormat} size={40} />
        <Text variant="captionStrong" numberOfLines={1} style={{ marginTop: theme.spacing.md }}>
          {record.name}
        </Text>
        <Text variant="micro" color="faint" numberOfLines={1} style={{ marginTop: 3 }}>
          {formatBytes(record.size)} · {formatRelativeDate(record.createdAt)}
        </Text>
      </View>
    </Card>
  );
}
