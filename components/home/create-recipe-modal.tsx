import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Chip, Dialog, IconButton, MD3Theme, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  addRecipeToGroup,
  createRecipe,
  getGroups,
  getTagsAutocomplete,
  type RecipeGroup,
} from '@/services/recipes';

type IngredientRow = { id: string; name: string; amount: string };

type CreateRecipeModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
};

export const CreateRecipeModal = ({ visible, onDismiss, onSuccess }: CreateRecipeModalProps) => {
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [tagQuery, setTagQuery] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [groups, setGroups] = useState<RecipeGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName(''); setDescription(''); setInstructions(''); setImageUri(null);
    setIngredients([]); setTagQuery(''); setTagSuggestions([]);
    setSelectedTags([]); setSelectedGroupId(null); setCreateError(null);
  }, []);

  useEffect(() => {
    if (!visible) return;
    resetForm();
    setIsLoadingGroups(true);
    getGroups(20, 1)
      .then(data => setGroups(data))
      .catch(() => {})
      .finally(() => setIsLoadingGroups(false));
  }, [visible, resetForm]);

  useEffect(() => {
    const trimmed = tagQuery.trim();
    if (trimmed.length < 2) { setTagSuggestions([]); setIsLoadingTags(false); return; }
    setIsLoadingTags(true);
    const t = setTimeout(async () => {
      try {
        const r = await getTagsAutocomplete(trimmed, 6);
        setTagSuggestions(r.filter(s => !selectedTags.includes(s)));
      } catch { setTagSuggestions([]); }
      finally { setIsLoadingTags(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [tagQuery, selectedTags]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addIngredient = () =>
    setIngredients(p => [...p, { id: Date.now().toString(), name: '', amount: '' }]);
  const updateIngredient = (id: string, f: 'name' | 'amount', v: string) =>
    setIngredients(p => p.map(i => i.id === id ? { ...i, [f]: v } : i));
  const removeIngredient = (id: string) =>
    setIngredients(p => p.filter(i => i.id !== id));

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !selectedTags.includes(clean)) setSelectedTags(p => [...p, clean]);
    setTagQuery(''); setTagSuggestions([]);
  };
  const removeTag = (tag: string) => setSelectedTags(p => p.filter(t => t !== tag));

  const handleCreate = async () => {
    const trimmedName = name.trim();
    const trimmedInstructions = instructions.trim();
    if (!trimmedName || !trimmedInstructions || !selectedGroupId) return;
    setIsCreating(true); setCreateError(null);
    try {
      const ingredientsMap: Record<string, string> = {};
      ingredients.forEach(r => { if (r.name.trim()) ingredientsMap[r.name.trim()] = r.amount.trim(); });
      const result = await createRecipe({
        name: trimmedName,
        instructions: trimmedInstructions,
        description: description.trim() || null,
        ingredients: Object.keys(ingredientsMap).length > 0 ? ingredientsMap : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        imageUri,
      });
      if (result.id) {
        try { await addRecipeToGroup(selectedGroupId, result.id); } catch { /* recipe created, group add failed */ }
      }
      resetForm(); onSuccess?.(); onDismiss();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[createRecipe]', msg);
      setCreateError(msg.includes('400') ? 'Datos inválidos. Revisa los campos.' : msg.includes('401') ? 'Sesión expirada. Vuelve a iniciar sesión.' : 'No se pudo crear la receta. Intenta de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = name.trim().length > 0 && instructions.trim().length > 0 && !!selectedGroupId;
  const canAddCustomTag = tagQuery.trim().length > 0 &&
    !tagSuggestions.includes(tagQuery.trim()) &&
    !selectedTags.includes(tagQuery.trim());

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>Nueva receta</Dialog.Title>

        <Dialog.Content style={styles.dialogContent}>
          <ScrollView
            style={{ maxHeight: screenHeight * 0.68 }}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Imagen ── */}
            <Pressable onPress={pickImage} style={[
              styles.imagePicker,
              { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.elevation.level1 },
            ]}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <View style={styles.imageOverlay}>
                    <IconButton
                      icon="close-circle"
                      size={26}
                      iconColor="#fff"
                      style={styles.removeImageBtn}
                      onPress={e => { e.stopPropagation?.(); setImageUri(null); }}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <MaterialCommunityIcons name="image-plus" size={36} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={[styles.imagePickerText, { color: theme.colors.onSurfaceVariant }]}>
                    Toca para agregar una foto
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.6 }}>
                    JPEG · PNG · GIF · WEBP
                  </Text>
                </View>
              )}
            </Pressable>

            {/* ── Información básica ── */}
            <SectionCard theme={theme} icon="silverware-fork-knife" label="Información básica">
              <TextInput
                mode="outlined"
                label="Nombre *"
                value={name}
                onChangeText={setName}
                maxLength={100}
                dense
              />
              <TextInput
                mode="outlined"
                label="Descripción (opcional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
                maxLength={300}
                dense
              />
            </SectionCard>

            {/* ── Instrucciones ── */}
            <SectionCard theme={theme} icon="format-list-numbered" label="Instrucciones *">
              <TextInput
                mode="outlined"
                label="Pasos para preparar la receta"
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={4}
                dense
              />
            </SectionCard>

            {/* ── Ingredientes ── */}
            <SectionCard theme={theme} icon="food-variant" label="Ingredientes">
              {ingredients.map(row => (
                <View key={row.id} style={styles.ingredientRow}>
                  <TextInput
                    mode="outlined"
                    label="Ingrediente"
                    value={row.name}
                    onChangeText={v => updateIngredient(row.id, 'name', v)}
                    style={styles.ingredientName}
                    dense
                  />
                  <TextInput
                    mode="outlined"
                    label="Cantidad"
                    value={row.amount}
                    onChangeText={v => updateIngredient(row.id, 'amount', v)}
                    style={styles.ingredientAmount}
                    dense
                  />
                  <IconButton icon="minus-circle-outline" size={20} onPress={() => removeIngredient(row.id)} style={styles.removeBtn} />
                </View>
              ))}
              <Button mode="text" icon="plus" compact onPress={addIngredient} style={styles.textBtn} labelStyle={styles.textBtnLabel}>
                Agregar ingrediente
              </Button>
            </SectionCard>

            {/* ── Tags ── */}
            <SectionCard theme={theme} icon="tag-multiple-outline" label="Tags">
              <TextInput
                mode="outlined"
                label="Buscar tag o escribir uno nuevo"
                value={tagQuery}
                onChangeText={setTagQuery}
                dense
                right={isLoadingTags
                  ? <TextInput.Icon icon={() => <ActivityIndicator size={14} color={theme.colors.primary} />} />
                  : undefined
                }
              />
              {tagSuggestions.length > 0 && (
                <View style={styles.chipsWrap}>
                  {tagSuggestions.map(tag => (
                    <Chip key={tag} compact icon="tag-plus-outline" onPress={() => addTag(tag)} style={styles.suggestionChip}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}
              {canAddCustomTag && (
                <Button mode="text" icon="tag-plus" compact onPress={() => addTag(tagQuery.trim())} style={styles.textBtn} labelStyle={styles.textBtnLabel}>
                  Crear tag "{tagQuery.trim()}"
                </Button>
              )}
              {selectedTags.length > 0 && (
                <View style={styles.chipsWrap}>
                  {selectedTags.map(tag => (
                    <Chip
                      key={tag}
                      compact
                      onClose={() => removeTag(tag)}
                      style={[styles.selectedChip, { backgroundColor: theme.colors.secondaryContainer }]}
                      textStyle={{ color: theme.colors.onSecondaryContainer }}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}
            </SectionCard>

            {/* ── Grupo (requerido) ── */}
            <SectionCard
              theme={theme}
              icon="folder-open-outline"
              label="Grupo *"
              accent={!selectedGroupId ? theme.colors.primary : undefined}
            >
              {isLoadingGroups ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ alignSelf: 'flex-start' }} />
              ) : groups.length === 0 ? (
                <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                  Crea un grupo primero para poder guardar la receta.
                </Text>
              ) : (
                <View style={styles.chipsWrap}>
                  {groups.map(group => (
                    <Chip
                      key={group.groupId}
                      compact
                      selected={selectedGroupId === group.groupId}
                      onPress={() => setSelectedGroupId(p => p === group.groupId ? null : group.groupId)}
                      icon={selectedGroupId === group.groupId ? 'check' : 'folder-outline'}
                      style={[
                        styles.groupChip,
                        selectedGroupId === group.groupId && { backgroundColor: theme.colors.primaryContainer },
                      ]}
                      textStyle={selectedGroupId === group.groupId ? { color: theme.colors.onPrimaryContainer } : undefined}
                    >
                      {group.groupName}
                    </Chip>
                  ))}
                </View>
              )}
              {!selectedGroupId && groups.length > 0 && (
                <Text variant="labelSmall" style={[styles.requiredHint, { color: theme.colors.primary }]}>
                  Selecciona un grupo para continuar
                </Text>
              )}
            </SectionCard>

          </ScrollView>
        </Dialog.Content>

        {createError ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.colors.onErrorContainer} />
            <Text variant="bodySmall" style={[styles.errorBannerText, { color: theme.colors.onErrorContainer }]}>
              {createError}
            </Text>
          </View>
        ) : null}

        <Dialog.Actions style={styles.actions}>
          <Button onPress={onDismiss} disabled={isCreating}>Cancelar</Button>
          <Button
            mode="contained"
            loading={isCreating}
            disabled={isCreating || !isValid}
            onPress={handleCreate}
            style={styles.createBtn}
          >
            Crear receta
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// ── Componente auxiliar de sección ──────────────────────────────────────────
type SectionCardProps = {
  theme: MD3Theme;
  icon: string;
  label: string;
  accent?: string;
  children: React.ReactNode;
};

const SectionCard = ({ theme, icon, label, accent, children }: SectionCardProps) => (
  <View style={[
    styles.sectionCard,
    {
      backgroundColor: theme.colors.elevation.level1,
      borderColor: accent ?? theme.colors.outlineVariant,
    },
  ]}>
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon as any} size={16} color={accent ?? theme.colors.onSurfaceVariant} />
      <Text variant="labelLarge" style={[styles.sectionLabel, { color: accent ?? theme.colors.onSurface }]}>
        {label}
      </Text>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 24,
  },
  dialogTitle: {
    fontWeight: '700',
  },
  dialogContent: {
    paddingBottom: 0,
    paddingHorizontal: 16,
  },
  formContent: {
    gap: 12,
    paddingBottom: 4,
  },
  // Image picker
  imagePicker: {
    height: 152,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imagePickerText: {
    fontWeight: '600',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  removeImageBtn: {
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 99,
  },
  // Section cards
  sectionCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionLabel: {
    fontWeight: '700',
  },
  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ingredientName: {
    flex: 2,
  },
  ingredientAmount: {
    flex: 1,
  },
  removeBtn: {
    margin: 0,
    marginTop: 2,
  },
  textBtn: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  textBtnLabel: {
    fontSize: 13,
  },
  // Tags/chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    borderRadius: 999,
  },
  selectedChip: {
    borderRadius: 999,
  },
  groupChip: {
    borderRadius: 999,
  },
  requiredHint: {
    marginTop: -4,
    fontStyle: 'italic',
  },
  // Error banner (fixed, outside scroll)
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorBannerText: {
    flex: 1,
    lineHeight: 18,
  },
  // Actions
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  createBtn: {
    borderRadius: 14,
  },
});
