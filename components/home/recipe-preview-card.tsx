import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

type RecipePreviewCardProps = {
  title: string;
  creator: string;
  badge: string;
  variant?: 'compact' | 'featured';
};

export const RecipePreviewCard = ({ title, creator, badge, variant = 'compact' }: RecipePreviewCardProps) => {
  const theme = useTheme();
  const isCompact = variant === 'compact';

  return (
    <Surface style={[styles.base, isCompact ? styles.compact : styles.featured, { backgroundColor: theme.colors.elevation.level2 }]} elevation={1}>
      <View
        style={[
          isCompact ? styles.compactCover : styles.featuredCover,
          { backgroundColor: isCompact ? theme.colors.primaryContainer : theme.colors.secondaryContainer },
        ]}
      >
        <Text variant={isCompact ? 'labelMedium' : 'labelLarge'} style={{ color: isCompact ? theme.colors.onPrimaryContainer : theme.colors.onSecondaryContainer }}>
          {badge}
        </Text>
      </View>
      <Text variant={isCompact ? 'titleSmall' : 'titleMedium'} style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text variant="bodySmall" style={styles.creator} numberOfLines={1}>
        {creator}
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: 12,
    gap: 10,
  },
  compact: {
    width: '48%',
  },
  featured: {
    width: 212,
  },
  compactCover: {
    height: 92,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCover: {
    height: 112,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
  },
  creator: {
    opacity: 0.72,
  },
});