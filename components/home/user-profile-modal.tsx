import { OtpInput } from '@/components/ui/otp-input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Divider, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { changeUserEmail, changeUsername, deleteUserAccount, getUserProfile, verifyEmailChange, type UserProfile } from '@/services/user';

type ModalView = 'profile' | 'changeEmail' | 'changeUsername' | 'deleteConfirm';

type UserProfileModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const UserProfileModal = ({ visible, onDismiss }: UserProfileModalProps) => {
  const theme = useTheme();
  const router = useRouter();

  const [view, setView] = useState<ModalView>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Email change is a 2-step flow: enter new email → enter the 6-digit code → done
  const [emailStep, setEmailStep] = useState<'email' | 'code' | 'done'>('email');
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [changeUsernameError, setChangeUsernameError] = useState<string | null>(null);

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch {
      setProfileError('No se pudo cargar el perfil.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const resetEmailFlow = () => {
    setEmailStep('email');
    setNewEmail('');
    setEmailCode('');
    setChangeEmailError(null);
  };

  useEffect(() => {
    if (visible) {
      setView('profile');
      resetEmailFlow();
      setNewUsername('');
      setChangeUsernameError(null);
      setDeleteError(null);
      loadProfile();
    }
  }, [visible, loadProfile]);

  const handleDismiss = () => {
    setView('profile');
    resetEmailFlow();
    setNewUsername('');
    setChangeUsernameError(null);
    setDeleteError(null);
    onDismiss();
  };

  const handleChangeEmail = async () => {
    const email = newEmail.trim();
    if (!email) return;
    setIsChangingEmail(true);
    setChangeEmailError(null);
    try {
      await changeUserEmail(email);
      setEmailCode('');
      setEmailStep('code');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setChangeEmailError(
        msg.includes('409') ? 'Ese email ya está en uso.' : 'No se pudo iniciar el cambio de email. Intenta de nuevo.'
      );
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (emailCode.length !== 6) return;
    setIsVerifyingEmail(true);
    setChangeEmailError(null);
    try {
      await verifyEmailChange(emailCode);
      await loadProfile();
      setEmailStep('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setChangeEmailError(
        msg.includes('400') ? 'Código inválido o expirado.' :
        msg.includes('409') ? 'Ese email ya está en uso.' :
        'No se pudo verificar el código. Intenta de nuevo.'
      );
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleChangeUsername = async () => {
    const username = newUsername.trim();
    if (!username || username === profile?.username) return;
    setIsChangingUsername(true);
    setChangeUsernameError(null);
    try {
      await changeUsername(username);
      await loadProfile();
      setNewUsername('');
      setView('profile');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setChangeUsernameError(
        msg.includes('409') ? 'Ese nombre de usuario ya está en uso.' : 'No se pudo cambiar el nombre de usuario. Intenta de nuevo.'
      );
    } finally {
      setIsChangingUsername(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteUserAccount();
      await SecureStore.deleteItemAsync('has_valid_session');
      onDismiss();
      router.replace('/(auth)/login');
    } catch {
      setDeleteError('No se pudo eliminar la cuenta. Intenta de nuevo.');
      setIsDeletingAccount(false);
    }
  };

  const titleMap: Record<ModalView, string> = {
    profile: 'Mi perfil',
    changeEmail: 'Cambiar email',
    changeUsername: 'Cambiar nombre de usuario',
    deleteConfirm: 'Eliminar cuenta',
  };

  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? '··';

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>{titleMap[view]}</Dialog.Title>

        <Dialog.Content style={styles.dialogContent}>

          {/* ── Perfil ── */}
          {view === 'profile' && (
            <>
              {isLoadingProfile ? (
                <View style={styles.centeredRow}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.mutedText}>Cargando perfil...</Text>
                </View>
              ) : profileError ? (
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>{profileError}</Text>
              ) : profile ? (
                <>
                  {/* Cabecera avatar */}
                  <View style={styles.profileHeader}>
                    <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                      <Text variant="headlineSmall" style={[styles.profileAvatarLabel, { color: theme.colors.onPrimaryContainer }]}>
                        {initials}
                      </Text>
                    </View>
                    <Text variant="titleLarge" style={styles.profileUsername}>{profile.username}</Text>
                    <Chip
                      compact
                      style={[styles.statusChip, {
                        backgroundColor: profile.isActive
                          ? theme.colors.tertiaryContainer
                          : theme.colors.errorContainer,
                      }]}
                      textStyle={{
                        fontSize: 11,
                        color: profile.isActive
                          ? theme.colors.onTertiaryContainer
                          : theme.colors.onErrorContainer,
                      }}
                    >
                      {profile.isActive ? 'Activo' : 'Inactivo'}
                    </Chip>
                  </View>

                  <Divider style={styles.divider} />

                  {/* Datos */}
                  <View style={styles.infoRow}>
                    <Text variant="labelSmall" style={styles.infoLabel}>EMAIL</Text>
                    <Text variant="bodyMedium" style={styles.infoValue} numberOfLines={1}>{profile.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="labelSmall" style={styles.infoLabel}>ID</Text>
                    <Text variant="bodySmall" style={[styles.infoValue, styles.mutedText]} numberOfLines={1}>{profile.id}</Text>
                  </View>
                  <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                    <Text variant="labelSmall" style={[styles.infoLabel, { paddingTop: 4 }]}>ROLES</Text>
                    <View style={styles.rolesWrap}>
                      {profile.roles.map(role => (
                        <Chip key={role} compact style={styles.roleChip} textStyle={styles.roleChipText}>{role}</Chip>
                      ))}
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  {/* Acciones */}
                  <View style={styles.actionsCol}>
                    <Button
                      mode="outlined"
                      icon="account-edit-outline"
                      onPress={() => { setNewUsername(profile.username); setView('changeUsername'); }}
                      style={styles.actionBtn}
                      contentStyle={styles.actionBtnContent}
                    >
                      Cambiar nombre de usuario
                    </Button>
                    <Button
                      mode="outlined"
                      icon="email-edit-outline"
                      onPress={() => setView('changeEmail')}
                      style={styles.actionBtn}
                      contentStyle={styles.actionBtnContent}
                    >
                      Cambiar email
                    </Button>
                    <Button
                      mode="outlined"
                      icon="account-remove-outline"
                      onPress={() => setView('deleteConfirm')}
                      style={[styles.actionBtn, { borderColor: theme.colors.error }]}
                      textColor={theme.colors.error}
                      contentStyle={styles.actionBtnContent}
                    >
                      Eliminar cuenta
                    </Button>
                  </View>
                </>
              ) : null}
            </>
          )}

          {/* ── Cambiar email ── */}
          {view === 'changeEmail' && (
            <View style={styles.subView}>
              {emailStep === 'email' && (
                <>
                  <Text variant="bodyMedium" style={styles.mutedText}>
                    Introduce tu nuevo email. Te enviaremos un código de 6 dígitos para confirmar el cambio.
                  </Text>
                  <TextInput
                    mode="outlined"
                    label="Nuevo email"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    left={<TextInput.Icon icon="email-outline" />}
                  />
                  {changeEmailError ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.error }}>{changeEmailError}</Text>
                  ) : null}
                </>
              )}

              {emailStep === 'code' && (
                <>
                  <Text variant="bodyMedium" style={[styles.mutedText, { textAlign: 'center' }]}>
                    Enviamos un código de 6 dígitos a{'\n'}
                    <Text style={{ fontWeight: '700' }}>{newEmail.trim()}</Text>
                  </Text>
                  <OtpInput value={emailCode} onChangeText={setEmailCode} size="sm" autoFocus />
                  {changeEmailError ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.error, textAlign: 'center' }}>{changeEmailError}</Text>
                  ) : null}
                </>
              )}

              {emailStep === 'done' && (
                <View style={styles.successBlock}>
                  <MaterialCommunityIcons name="email-check-outline" size={48} color={theme.colors.primary} />
                  <Text variant="titleMedium" style={styles.successTitle}>¡Email actualizado!</Text>
                  <Text variant="bodyMedium" style={[styles.mutedText, { textAlign: 'center' }]}>
                    Tu correo ahora es{'\n'}
                    <Text style={{ fontWeight: '700' }}>{newEmail.trim()}</Text>.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Cambiar username ── */}
          {view === 'changeUsername' && (
            <View style={styles.subView}>
              <Text variant="bodyMedium" style={styles.mutedText}>
                Elige un nuevo nombre de usuario. Debe ser distinto al actual.
              </Text>
              <TextInput
                mode="outlined"
                label="Nuevo nombre de usuario"
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
                maxLength={30}
                left={<TextInput.Icon icon="account-outline" />}
              />
              {changeUsernameError ? (
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>{changeUsernameError}</Text>
              ) : null}
            </View>
          )}

          {/* ── Confirmar borrado ── */}
          {view === 'deleteConfirm' && (
            <View style={styles.subView}>
              <View style={styles.deleteWarningBlock}>
                <MaterialCommunityIcons name="alert-circle-outline" size={40} color={theme.colors.error} />
                <Text variant="bodyMedium" style={[styles.deleteWarningText, { color: theme.colors.error }]}>
                  Esta acción es permanente e irreversible.
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.mutedText}>
                Se eliminarán tu cuenta y todos tus datos asociados. No podrás recuperarlos.
              </Text>
              {deleteError ? (
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>{deleteError}</Text>
              ) : null}
            </View>
          )}

        </Dialog.Content>

        <Dialog.Actions>
          {view === 'profile' && (
            <Button onPress={handleDismiss}>Cerrar</Button>
          )}

          {view === 'changeEmail' && emailStep === 'email' && (
            <Button
              onPress={() => { setView('profile'); resetEmailFlow(); }}
              disabled={isChangingEmail}
            >
              Volver
            </Button>
          )}
          {view === 'changeEmail' && emailStep === 'email' && (
            <Button
              mode="contained"
              loading={isChangingEmail}
              disabled={isChangingEmail || !newEmail.trim().includes('@')}
              onPress={handleChangeEmail}
            >
              Enviar código
            </Button>
          )}

          {view === 'changeEmail' && emailStep === 'code' && (
            <Button
              onPress={() => { setEmailStep('email'); setEmailCode(''); setChangeEmailError(null); }}
              disabled={isVerifyingEmail}
            >
              Volver
            </Button>
          )}
          {view === 'changeEmail' && emailStep === 'code' && (
            <Button
              mode="contained"
              loading={isVerifyingEmail}
              disabled={isVerifyingEmail || emailCode.length !== 6}
              onPress={handleVerifyEmailChange}
            >
              Verificar
            </Button>
          )}

          {view === 'changeEmail' && emailStep === 'done' && (
            <Button onPress={() => { setView('profile'); resetEmailFlow(); }}>
              Entendido
            </Button>
          )}

          {view === 'changeUsername' && (
            <Button
              onPress={() => { setView('profile'); setNewUsername(''); setChangeUsernameError(null); }}
              disabled={isChangingUsername}
            >
              Volver
            </Button>
          )}
          {view === 'changeUsername' && (
            <Button
              mode="contained"
              loading={isChangingUsername}
              disabled={isChangingUsername || !newUsername.trim() || newUsername.trim() === profile?.username}
              onPress={handleChangeUsername}
            >
              Guardar
            </Button>
          )}

          {view === 'deleteConfirm' && (
            <Button
              onPress={() => { setView('profile'); setDeleteError(null); }}
              disabled={isDeletingAccount}
            >
              Cancelar
            </Button>
          )}
          {view === 'deleteConfirm' && (
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              loading={isDeletingAccount}
              disabled={isDeletingAccount}
              onPress={handleDeleteAccount}
            >
              Eliminar
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 24,
  },
  dialogTitle: {
    fontWeight: '700',
  },
  dialogContent: {
    gap: 0,
  },
  centeredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  mutedText: {
    opacity: 0.72,
    lineHeight: 20,
  },
  profileHeader: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  profileAvatarLabel: {
    fontWeight: '800',
  },
  profileUsername: {
    fontWeight: '700',
  },
  statusChip: {
    borderRadius: 999,
  },
  divider: {
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoLabel: {
    opacity: 0.5,
    width: 52,
    letterSpacing: 0.6,
  },
  infoValue: {
    flex: 1,
  },
  rolesWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    borderRadius: 999,
  },
  roleChipText: {
    fontSize: 11,
  },
  actionsCol: {
    gap: 10,
  },
  actionBtn: {
    borderRadius: 14,
  },
  actionBtnContent: {
    paddingVertical: 2,
  },
  subView: {
    gap: 14,
    paddingVertical: 4,
  },
  successBlock: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  successTitle: {
    fontWeight: '700',
  },
  deleteWarningBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteWarningText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 20,
  },
});
