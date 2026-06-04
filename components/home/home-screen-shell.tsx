import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Searchbar, Text, useTheme } from 'react-native-paper';

type HomeScreenShellProps = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  children: React.ReactNode;
};

export const HomeScreenShell = ({ title, subtitle, searchPlaceholder, children }: HomeScreenShellProps) => {
  const theme = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={{ backgroundColor: theme.colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sceneBackgroundAccent} />

      <View style={styles.headerRow}>
        <View style={styles.headerTextBlock}>
          <Text variant="headlineSmall" style={styles.pageTitle}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.pageSubtitle}>
            {subtitle}
          </Text>
        </View>
        <Avatar.Text
          size={44}
          label="AT"
          style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
          labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}
        />
      </View>

      <Searchbar
        placeholder={searchPlaceholder}
        value=""
        onChangeText={() => {}}
        style={[styles.searchbar, { backgroundColor: theme.colors.elevation.level2 }]}
        inputStyle={styles.searchInput}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 18,
  },
  sceneBackgroundAccent: {
    position: 'absolute',
    top: -32,
    right: -72,
    width: 190,
    height: 190,
    borderRadius: 190,
    backgroundColor: 'rgba(142, 77, 45, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  headerTextBlock: {
    flex: 1,
    gap: 4,
  },
  pageTitle: {
    fontWeight: '800',
  },
  pageSubtitle: {
    opacity: 0.82,
  },
  avatar: {
    borderRadius: 22,
  },
  searchbar: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  searchInput: {
    minHeight: 0,
  },
});