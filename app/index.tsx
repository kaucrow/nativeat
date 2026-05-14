import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Index() {
  const theme = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const localSession = await SecureStore.getItemAsync('has_valid_session');

        if (localSession === 'true') {
          setIsAuthenticated(true);

          return;
        }

        // If no local session, ping the backend just in case
        const res = await fetch(`${BACKEND_URL}/api/auth/me`);

        if (res.ok) {
          await SecureStore.setItemAsync('has_valid_session', 'true');
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        // If the network fails and there is no local session, send the user to login
        setIsAuthenticated(false);
      }
    };

    verifySession();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
        Welcome to NativEat! :D
      </Text>
    </View>
  );
}