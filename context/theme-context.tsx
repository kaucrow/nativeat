import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { darkTheme, lightTheme } from '@/constants/theme';

const THEME_KEY = '@user_theme_preference';

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
  clearThemePreference: async () => {},
  isLoading: true,
});

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // If no saved preference, follow system
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (e) {
        console.error("Failed to load theme", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  };

  const clearThemePreference = async () => {
    try {
      await AsyncStorage.removeItem(THEME_KEY);
      setIsDarkMode(systemColorScheme === 'dark');
    } catch (e) {
      console.error("Failed to clear theme", e);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, clearThemePreference, isLoading }}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);