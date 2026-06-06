import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Searchbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserProfileModal } from '@/components/home/user-profile-modal';

type HomeScreenShellProps = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  /** Enables pull-to-refresh. When provided, swiping down triggers onRefresh. */
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
};

export const HomeScreenShell = ({ title, subtitle, searchPlaceholder, searchValue, onSearchChange, refreshing, onRefresh, children }: HomeScreenShellProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isProfileVisible, setIsProfileVisible] = useState(false);

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(16, insets.top + 8) }]}
      style={{ backgroundColor: theme.colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh
          ? <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          : undefined
      }
    >
      <View style={styles.sceneBackgroundAccent} />

      <View style={[styles.headerRow, { marginTop: 2 }] }>
        <View style={styles.headerTextBlock}>
          <Text variant="headlineSmall" style={styles.pageTitle}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.pageSubtitle}>
            {subtitle}
          </Text>
        </View>
        <Pressable
          onPress={() => setIsProfileVisible(true)}
          style={({ pressed }) => pressed ? styles.avatarPressed : null}
        >
          <Avatar.Text
            size={44}
            label="AT"
            style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
            labelStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}
          />
        </Pressable>
      </View>

      <Searchbar
        placeholder={searchPlaceholder}
        value={searchValue ?? ''}
        onChangeText={onSearchChange ?? (() => {})}
        style={[styles.searchbar, { backgroundColor: theme.colors.elevation.level2 }]}
        inputStyle={styles.searchInput}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      {children}

      <UserProfileModal
        visible={isProfileVisible}
        onDismiss={() => setIsProfileVisible(false)}
      />
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
  avatarPressed: {
    opacity: 0.75,
  },
  searchbar: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  searchInput: {
    minHeight: 0,
  },
});