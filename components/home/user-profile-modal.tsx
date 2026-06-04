import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Divider, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { changeUserEmail, deleteUserAccount, getUserProfile, type UserProfile } from '@/services/user';

type ModalView = 'profile' | 'changeEmail' | 'deleteConfirm';

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

  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);
  const [changeEmailSuccess, setChangeEmailSuccess] = useState(false);

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

  useEffect(() => {
    if (visible) {
      setView('profile');
      setNewEmail('');
      setChangeEmailError(null);
      setChangeEmailSuccess(false);
      setDeleteError(null);
      loadProfile();
    }
  }, [visible, loadProfile]);

  const handleDismiss = () => {
    setView('profile');
    setNewEmail('');
    setChangeEmailError(null);
    setChangeEmailSuccess(false);
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
      setChangeEmailSuccess(true);
    } catch {
      setChangeEmailError('No se pudo iniciar el cambio de email. Intenta de nuevo.');
    } finally {
      setIsChangingEmail(false);
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
              {changeEmailSuccess ? (
                <View style={styles.successBlock}>
                  <MaterialCommunityIcons name="email-check-outline" size={48} color={theme.colors.primary} />
                  <Text variant="titleMedium" style={styles.successTitle}>¡Código enviado!</Text>
                  <Text variant="bodyMedium" style={[styles.mutedText, { textAlign: 'center' }]}>
                    Enviamos un código de verificación a{'\n'}
                    <Text style={{ fontWeight: '700' }}>{newEmail.trim()}</Text>.
                    {'\n'}Revisa tu bandeja de entrada.
                  </Text>
                </View>
              ) : (
                <>
                  <Text variant="bodyMedium" style={styles.mutedText}>
                    Introduce tu nuevo email. Te enviaremos un código para confirmar el cambio.
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

          {view === 'changeEmail' && !changeEmailSuccess && (
            <>
              <Button
                onPress={() => { setView('profile'); setNewEmail(''); setChangeEmailError(null); }}
                disabled={isChangingEmail}
              >
                Volver
              </Button>
              <Button
                mode="contained"
                loading={isChangingEmail}
                disabled={isChangingEmail || !newEmail.trim().includes('@')}
                onPress={handleChangeEmail}
              >
                Enviar código
              </Button>
            </>
          )}

          {view === 'changeEmail' && changeEmailSuccess && (
            <Button onPress={() => { setView('profile'); setNewEmail(''); setChangeEmailSuccess(false); }}>
              Entendido
            </Button>
          )}

          {view === 'deleteConfirm' && (
            <>
              <Button
                onPress={() => { setView('profile'); setDeleteError(null); }}
                disabled={isDeletingAccount}
              >
                Cancelar
              </Button>
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
            </>
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
