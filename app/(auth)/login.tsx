import { handleNativeSocialAuth, loginUser, registerUser } from '@/components/auth';
import { LoginForm } from '@/components/ui/auth/login-form';
import { RegisterForm } from '@/components/ui/auth/register-form';
import { SocialAuth } from '@/components/ui/auth/social-auth';
import { useAppTheme } from '@/context/theme-context';
import { LoginFormData, RegisterFormData } from '@/types/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Divider, Text, useTheme } from 'react-native-paper';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

export default function LoginScreen() {
  const { isDarkMode } = useAppTheme();
  const theme = useTheme();
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'Google' | 'GitHub' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    const result = await loginUser(data);

    if (result.success) {
      await SecureStore.setItemAsync('has_valid_session', 'true');
      router.replace('/'); 
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    const result = await registerUser(data);

    if (result.success) {
      router.replace({ pathname: '/verify-pending', params: { email: data.email } });
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }

    setLoading(false);
  };

  const onSocialSubmit = async (provider: 'Google' | 'GitHub') => {
    setLoadingProvider(provider);
    setError(null); // Clear any previous errors

    const result = await handleNativeSocialAuth(provider);

    if (result?.success) {
      await SecureStore.setItemAsync('has_valid_session', 'true');
      router.replace('/'); 
    } else {
      setError(result?.error || `${provider} authentication failed.`);
    }

    setLoadingProvider(null);
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null); // Clear errors when switching between Login and Register
  };

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets={true}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background }}
    >
      <View className="flex-row items-center justify-center mb-6 mt-10">
        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={40}
          color={theme.colors.primary}
          style={{ marginRight: 8 }}
        />
        <Text
          variant="displayMedium" 
          style={{ color: theme.colors.primary, fontWeight: '800' }}
        >
          NativEat
        </Text>
      </View>
      <View style={{
        backgroundColor: theme.colors.elevation.level1,
        marginHorizontal: 24,
        padding: 24,
        borderRadius: 24,
        borderWidth: isDarkMode ? 0 : 1,
        borderColor: theme.colors.outlineVariant,
        elevation: 4
      }}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 }}>
          {isRegister ? 'Create Account' : 'Sign In'}
        </Text>

        <Animated.View layout={LinearTransition.duration(300)}>
          {isRegister ? (
            <Animated.View
              key="register-form"
              entering={FadeIn.delay(100).duration(300)}
            >
              <RegisterForm
                onSubmit={onRegisterSubmit}
                loading={loading}
                errorMessage={error}
              />
            </Animated.View>
          ) : (
            <Animated.View
              key="login-form"
              entering={FadeIn.delay(100).duration(300)}
            >
              <LoginForm
                onSubmit={onLoginSubmit}
                loading={loading}
                errorMessage={error}
              />
            </Animated.View>
          )}
        </Animated.View>

        <View className="flex-row items-center my-6">
          <Divider style={{ flex: 1, backgroundColor: theme.colors.outlineVariant }} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 12 }}>OR</Text>
          <Divider style={{ flex: 1, backgroundColor: theme.colors.outlineVariant }} />
        </View>

        <Animated.View layout={LinearTransition.duration(300)}>
          <SocialAuth
            onAuth={onSocialSubmit}
            loadingProvider={loadingProvider}
            disabled={loading}
          />

          <View className="flex-row justify-center items-center mt-8">
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Button mode="text" compact onPress={toggleMode} labelStyle={{ fontWeight: 'bold' }}>
              {isRegister ? 'Sign In' : 'Sign Up'}
            </Button>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}