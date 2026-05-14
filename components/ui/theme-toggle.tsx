import { useAppTheme } from '@/context/theme-context';
import React from 'react';
import { View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useAppTheme();
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}>
        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </Text>
      <IconButton
        icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
        iconColor={theme.colors.primary}
        size={24}
        onPress={toggleTheme}
      />
    </View>
  );
};