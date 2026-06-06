import { verifyAccount } from '@/components/auth';
import { OtpInput } from '@/components/ui/otp-input';
import { useAppTheme } from '@/context/theme-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, HelperText, Text, useTheme } from 'react-native-paper';

const CODE_LENGTH = 6;

export default function VerifyPendingScreen() {
  const { isDarkMode } = useAppTheme();
  const theme = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (text: string) => {
    setCode(text);
    if (error) setError(null);
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) return;
    setLoading(true);
    setError(null);

    const result = await verifyAccount(code);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Código inválido o expirado. Inténtalo de nuevo.');
    }
    setLoading(false);
  };

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background }}
    >
      {/* Logo */}
      <View className="flex-row items-center justify-center mb-6 mt-10">
        <MaterialCommunityIcons name="silverware-fork-knife" size={40} color={theme.colors.primary} style={{ marginRight: 8 }} />
        <Text variant="displayMedium" style={{ color: theme.colors.primary, fontWeight: '800' }}>
          NativEat
        </Text>
      </View>

      {/* Card */}
      <View
        style={{
          backgroundColor: theme.colors.elevation.level1,
          marginHorizontal: 24,
          padding: 24,
          borderRadius: 24,
          borderWidth: isDarkMode ? 0 : 1,
          borderColor: theme.colors.outlineVariant,
          elevation: 4,
        }}
      >
        {success ? (
          /* ── Éxito ── */
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.primaryContainer,
              }}
            >
              <MaterialCommunityIcons name="check-decagram" size={44} color={theme.colors.primary} />
            </View>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold', textAlign: 'center' }}>
              ¡Cuenta verificada!
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Tu cuenta fue verificada con éxito. Ya puedes iniciar sesión.
            </Text>
            <Button mode="contained" onPress={() => router.replace('/login')} style={{ borderRadius: 12, width: '100%', marginTop: 4 }}>
              Ir a iniciar sesión
            </Button>
          </View>
        ) : (
          /* ── Ingreso de código ── */
          <>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <MaterialCommunityIcons name="email-fast-outline" size={56} color={theme.colors.primary} style={{ marginBottom: 12 }} />
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold', textAlign: 'center' }}>
                Verifica tu cuenta
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                Ingresa el código de 6 dígitos que enviamos
                {email ? <Text style={{ fontWeight: '700' }}> a {email}</Text> : ' a tu correo'}.
              </Text>
            </View>

            <OtpInput value={code} onChangeText={handleChange} length={CODE_LENGTH} autoFocus />

            <HelperText type="error" visible={!!error} padding="none" style={{ textAlign: 'center' }}>
              {error}
            </HelperText>

            <Button
              mode="contained"
              loading={loading}
              disabled={loading || code.length !== CODE_LENGTH}
              onPress={handleVerify}
              style={{ borderRadius: 12, marginTop: error ? 0 : 12 }}
            >
              Verificar
            </Button>

            <View className="flex-row justify-center items-center mt-6">
              <Text style={{ color: theme.colors.onSurfaceVariant }}>¿Te equivocaste de cuenta?</Text>
              <Button mode="text" compact onPress={() => router.replace('/login')} labelStyle={{ fontWeight: 'bold' }}>
                Volver
              </Button>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
