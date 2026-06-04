import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

type LibraryRecipeCardProps = {
  title: string;
  time: string;
  label: string;
  accent: string;
};

export const LibraryRecipeCard = ({ title, time, label, accent }: LibraryRecipeCardProps) => {
  const theme = useTheme();

  return (
    <Card mode="elevated" style={[styles.card, { backgroundColor: theme.colors.elevation.level2 }]}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Card.Content style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.thumbnail, { backgroundColor: theme.colors.elevation.level4 }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {label}
            </Text>
          </View>
        </View>
        <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          {time}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 22,
    overflow: 'hidden',
  },
  accent: {
    height: 8,
  },
  content: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thumbnail: {
    height: 92,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
  },
  meta: {
    opacity: 0.75,
  },
});