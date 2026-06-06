import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { addRecipeToGroup, getGroups, type RecipeGroup } from '@/services/recipes';

type AddToGroupDialogProps = {
  visible: boolean;
  recipeId: string | null;
  recipeName?: string;
  onDismiss: () => void;
};

export const AddToGroupDialog = ({ visible, recipeId, recipeName, onDismiss }: AddToGroupDialogProps) => {
  const theme = useTheme();

  const [groups, setGroups] = useState<RecipeGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelectedGroupId(null);
    setAddError(null);
    setSuccess(false);
    setGroupsError(null);
    setIsLoadingGroups(true);
    // groups_limit max is 20 (same as recipes_limit); we only need ids + names here.
    getGroups(20, 1, 0)
      .then(setGroups)
      .catch(() => setGroupsError('No se pudieron cargar tus grupos.'))
      .finally(() => setIsLoadingGroups(false));
  }, [visible]);

  const handleAdd = async () => {
    if (!recipeId || !selectedGroupId) return;
    setIsAdding(true);
    setAddError(null);
    try {
      await addRecipeToGroup(selectedGroupId, recipeId);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setAddError(
        msg.includes('404') ? 'El grupo no existe.' :
        msg.includes('409') ? 'La receta ya está en ese grupo.' :
        'No se pudo añadir la receta. Intenta de nuevo.'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const selectedGroupName = groups.find(g => g.groupId === selectedGroupId)?.groupName;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Añadir a grupo</Dialog.Title>
        <Dialog.Content>
          {success ? (
            <View style={styles.successBlock}>
              <MaterialCommunityIcons name="check-circle" size={44} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                Receta añadida a{' '}
                <Text style={{ fontWeight: '700' }}>{selectedGroupName}</Text> correctamente.
              </Text>
            </View>
          ) : isLoadingGroups ? (
            <View style={styles.row}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.muted}>Cargando tus grupos...</Text>
            </View>
          ) : groupsError ? (
            <Text variant="bodySmall" style={{ color: theme.colors.error }}>{groupsError}</Text>
          ) : groups.length === 0 ? (
            <View style={styles.emptyBlock}>
              <MaterialCommunityIcons name="folder-alert-outline" size={36} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={[styles.muted, { textAlign: 'center' }]}>
                No tienes grupos todavía. Crea uno desde tu librería para poder guardar recetas.
              </Text>
            </View>
          ) : (
            <>
              {recipeName ? (
                <Text variant="bodySmall" style={[styles.muted, { marginBottom: 12 }]}>
                  Elige a qué grupo añadir{' '}
                  <Text style={{ fontWeight: '700' }}>{recipeName}</Text>.
                </Text>
              ) : null}
              <View style={styles.chips}>
                {groups.map(g => {
                  const isSel = selectedGroupId === g.groupId;
                  return (
                    <Chip
                      key={g.groupId}
                      selected={isSel}
                      onPress={() => setSelectedGroupId(g.groupId)}
                      icon={isSel ? 'check' : 'folder-outline'}
                      style={[styles.chip, isSel && { backgroundColor: theme.colors.primaryContainer }]}
                      textStyle={isSel ? { color: theme.colors.onPrimaryContainer } : undefined}
                    >
                      {g.groupName}
                    </Chip>
                  );
                })}
              </View>
              {addError ? (
                <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 10 }}>{addError}</Text>
              ) : null}
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          {success && (
            <Button onPress={onDismiss}>Listo</Button>
          )}
          {!success && (
            <Button onPress={onDismiss} disabled={isAdding}>Cancelar</Button>
          )}
          {!success && groups.length > 0 && (
            <Button
              mode="contained"
              loading={isAdding}
              disabled={isAdding || !selectedGroupId}
              onPress={handleAdd}
            >
              Añadir
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: { borderRadius: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  muted: { opacity: 0.72 },
  emptyBlock: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999 },
  successBlock: { alignItems: 'center', gap: 12, paddingVertical: 8 },
});
