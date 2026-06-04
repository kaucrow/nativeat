import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

type HistorySearchItemProps = {
  query: string;
  kind: string;
  ago: string;
};

export const HistorySearchItem = ({ query, kind, ago }: HistorySearchItemProps) => {
  const theme = useTheme();

  return (
    <Surface style={[styles.item, { backgroundColor: theme.colors.elevation.level2 }]} elevation={1}>
      <View style={styles.icon}>
        <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
          ⌕
        </Text>
      </View>
      <View style={styles.textBlock}>
        <Text variant="titleMedium" style={styles.query} numberOfLines={1}>
          {query}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          {kind} · {ago}
        </Text>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  item: {
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(142, 77, 45, 0.12)',
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  query: {
    fontWeight: '700',
  },
  meta: {
    opacity: 0.72,
  },
});