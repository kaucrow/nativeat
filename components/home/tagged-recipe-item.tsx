import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

type TaggedRecipeItemProps = {
  title: string;
  creator: string;
  tag: string;
  thumbnailUrl?: string | null;
  onPress?: () => void;
};

export const TaggedRecipeItem = ({ title, creator, tag, thumbnailUrl, onPress }: TaggedRecipeItemProps) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => (onPress && pressed ? styles.pressed : null)}
    >
      <Surface style={[styles.item, { backgroundColor: theme.colors.elevation.level2 }]} elevation={1}>
        <View style={[styles.thumb, { backgroundColor: theme.colors.tertiaryContainer }]}>
          {thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text variant="labelMedium" style={{ color: theme.colors.onTertiaryContainer }}>
              {tag}
            </Text>
          )}
        </View>
        <View style={styles.textBlock}>
          <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text variant="bodySmall" style={styles.creator} numberOfLines={1}>
            {creator}
          </Text>
        </View>
      </Surface>
    </Pressable>
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
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '700',
  },
  creator: {
    opacity: 0.72,
  },
});