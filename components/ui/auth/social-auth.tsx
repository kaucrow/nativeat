import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';

interface SocialAuthProps {
  onAuth: (provider: 'Google' | 'GitHub') => void;
  loadingProvider: 'Google' | 'GitHub' | null;
  disabled: boolean;
}

export const SocialAuth = ({ onAuth, loadingProvider, disabled }: SocialAuthProps) => (
  <View className="flex-col gap-3">
    <Button
      mode="outlined"
      icon="google"
      loading={loadingProvider === 'Google'} 
      disabled={disabled}
      onPress={() => onAuth('Google')}
      style={{ borderRadius: 12 }}
    >
      Google
    </Button>
    <Button
      mode="outlined"
      icon="github"
      loading={loadingProvider === 'GitHub'}
      disabled={disabled}
      onPress={() => onAuth('GitHub')}
      style={{ borderRadius: 12, marginTop: 16 }}
    >
      GitHub
    </Button>
  </View>
);