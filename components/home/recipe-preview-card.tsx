import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

type RecipePreviewCardProps = {
  title: string;
  creator: string;
  badge: string;
  thumbnailUrl?: string;
  variant?: 'compact' | 'featured';
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export const RecipePreviewCard = ({ title, badge, thumbnailUrl, variant = 'compact', onPress, containerStyle }: RecipePreviewCardProps) => {
  const theme = useTheme();
  const isCompact = variant === 'compact';

  // Extract pixel width from containerStyle so the Surface (and Text inside it)
  // have a hard constraint. width:'100%' inside a horizontal ScrollView resolves
  // against the scroll container (no fixed width), not the Pressable parent.
  const flatContainer = StyleSheet.flatten(containerStyle);
  const explicitWidth = typeof flatContainer?.width === 'number' ? { width: flatContainer.width } : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [containerStyle, onPress && pressed ? styles.pressed : null]}
    >
      <Surface
        style={[
          styles.base,
          isCompact ? styles.compactCard : styles.featuredCard,
          { backgroundColor: theme.colors.elevation.level2 },
          explicitWidth,
        ]}
        elevation={1}
      >
        <View
          style={[
            isCompact ? styles.compactCover : styles.featuredCover,
            { backgroundColor: isCompact ? theme.colors.primaryContainer : theme.colors.secondaryContainer },
          ]}
        >
          {thumbnailUrl ? <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <View style={[StyleSheet.absoluteFill, styles.overlay]} />
        </View>
        <Text variant={isCompact ? 'titleSmall' : 'titleMedium'} style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.badgeBelow} numberOfLines={1}>
          {badge}
        </Text>
      </Surface>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: 12,
    gap: 10,
    // width: '100%' ensures Text inside cannot expand the card beyond the parent's
    // fixed pixel width (set via containerStyle on the Pressable wrapper).
    width: '100%',
  },
  compactCard: {
    height: 200,
  },
  featuredCard: {
    height: 230,
  },
  pressed: {
    opacity: 0.92,
  },
  compactCover: {
    height: 98,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  featuredCover: {
    height: 120,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  overlay: {
    backgroundColor: 'rgba(34, 26, 22, 0.12)',
  },
  badgeBelow: {
    opacity: 0.9,
    marginTop: 6,
    color: '#fff',
  },
  title: {
    fontWeight: '700',
    minHeight: 26,
  },
  creator: {
    opacity: 0.72,
  },
});