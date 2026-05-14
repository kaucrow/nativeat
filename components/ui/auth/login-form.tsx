import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

type LoginFormProps = {
  onSubmit: (data: any) => void;
  loading: boolean;
  errorMessage?: string | null; // Added error prop
};

export const LoginForm = ({ onSubmit, loading, errorMessage }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  return (
    <View className="flex-col gap-4">
      <TextInput 
        mode="outlined" 
        label="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        left={<TextInput.Icon icon="email" />} 
        error={!!errorMessage} // Turns the outline red on error
      />
      <TextInput 
        mode="outlined" 
        label="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry={secure}
        left={<TextInput.Icon icon="lock" />}
        right={<TextInput.Icon icon={secure ? "eye" : "eye-off"} onPress={() => setSecure(!secure)} />} 
        error={!!errorMessage} // Turns the outline red on error
      />

      {/* Displays the text only if there is an error */}
      <HelperText type="error" visible={!!errorMessage} padding="none">
        {errorMessage}
      </HelperText>

      <Button
        mode="contained"
        loading={loading}
        onPress={() => onSubmit({ email, password })}
        style={{ borderRadius: 12, marginTop: errorMessage ? 0 : 8 }}
      >
        Sign In
      </Button>
    </View>
  );
};