import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

type RegisterFormProps = {
  onSubmit: (data: any) => void;
  loading: boolean;
  errorMessage?: string | null;
};

export const RegisterForm = ({ onSubmit, loading, errorMessage }: RegisterFormProps) => {
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
  const [secure, setSecure] = useState(true);

  return (
    <View className="flex-col gap-4">
      <TextInput
        mode="outlined"
        label="Email"
        value={form.email}
        onChangeText={t => setForm({...form, email: t})}
        autoCapitalize="none"
        left={<TextInput.Icon icon="email" />}
        error={!!errorMessage}
      />
      <TextInput
        mode="outlined"
        label="Username"
        value={form.username}
        onChangeText={t => setForm({...form, username: t})}
        autoCapitalize="none"
        left={<TextInput.Icon icon="account" />}
        error={!!errorMessage}
      />
      <TextInput
        mode="outlined"
        label="Password"
        value={form.password}
        onChangeText={t => setForm({...form, password: t})}
        secureTextEntry={secure}
        left={<TextInput.Icon icon="lock" />}
        right={<TextInput.Icon icon={secure ? "eye" : "eye-off"} onPress={() => setSecure(!secure)} />}
        error={!!errorMessage}
      />
      <TextInput
        mode="outlined"
        label="Confirm Password"
        value={form.confirm}
        onChangeText={t => setForm({...form, confirm: t})}
        secureTextEntry={secure}
        left={<TextInput.Icon icon="lock-check" />}
        error={!!errorMessage}
      />

      <HelperText type="error" visible={!!errorMessage} padding="none">
        {errorMessage}
      </HelperText>

      <Button
        mode="contained"
        loading={loading}
        onPress={() => onSubmit(form)}
        style={{ borderRadius: 12, marginTop: errorMessage ? 0 : 8 }}
      >
        Register
      </Button>
    </View>
  );
};