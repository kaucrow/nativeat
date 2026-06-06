import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Chip, Dialog, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';

import { AddToGroupDialog } from '@/components/home/add-to-group-dialog';
import { CreateRecipeModal } from '@/components/home/create-recipe-modal';
import { HomeScreenShell } from '@/components/home/home-screen-shell';
import { RecipePreviewCard } from '@/components/home/recipe-preview-card';
import { SectionHeader } from '@/components/home/section-header';
import { TaggedRecipeItem } from '@/components/home/tagged-recipe-item';
import {
  createGroup,
  deleteGroup,
  deleteRecipe,
  getCreatedRecipes,
  getGroupRecipes,
  getGroups,
  getRecipeById,
  removeRecipeFromGroup,
  type GroupRecipeItem,
  type RecipeDetail,
  type RecipeGroup,
} from '@/services/recipes';

const GROUPS_PER_PAGE = 4;
const GROUP_DETAIL_LIMIT = 8;
const CREATED_PER_PAGE = 4;

export const LibraryScene = () => {
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  // Groups list (server-side paginated)
  const [groups, setGroups] = useState<RecipeGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [groupsPage, setGroupsPage] = useState(0);
  const [hasMoreGroups, setHasMoreGroups] = useState(false);

  // Group detail dialog
  const [isGroupDialogVisible, setIsGroupDialogVisible] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<RecipeGroup | null>(null);
  const [groupDetailRecipes, setGroupDetailRecipes] = useState<GroupRecipeItem[]>([]);
  const [groupDetailPage, setGroupDetailPage] = useState(1);
  const [groupDetailHasMore, setGroupDetailHasMore] = useState(false);
  const [isLoadingGroupDetail, setIsLoadingGroupDetail] = useState(false);

  // Recipe detail dialog
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  // When the recipe was opened from inside a group, this holds that group so the
  // detail dialog can offer "Quitar del grupo". Null when opened from "Mis recetas".
  const [detailGroup, setDetailGroup] = useState<{ id: string; name: string } | null>(null);
  const [isRemovingFromGroup, setIsRemovingFromGroup] = useState(false);
  const [removeFromGroupError, setRemoveFromGroupError] = useState<string | null>(null);
  // True when the open recipe is the user's own (from "Mis recetas"), so it can be deleted
  const [detailCanDelete, setDetailCanDelete] = useState(false);

  // Add-to-group dialog (reused from Explore/History)
  const [addToGroupRecipe, setAddToGroupRecipe] = useState<{ id: string; name: string } | null>(null);

  // Create group dialog
  const [isCreateGroupVisible, setIsCreateGroupVisible] = useState(false);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormDescription, setGroupFormDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  // Delete group dialog
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<RecipeGroup | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);

  // Create recipe modal
  const [isCreateRecipeVisible, setIsCreateRecipeVisible] = useState(false);

  // Created recipes ("Mis recetas", paginated 4 + load more)
  const [createdRecipes, setCreatedRecipes] = useState<GroupRecipeItem[]>([]);
  const [createdTotal, setCreatedTotal] = useState(0);
  const [isLoadingCreated, setIsLoadingCreated] = useState(true);
  const [isLoadingMoreCreated, setIsLoadingMoreCreated] = useState(false);
  const [createdError, setCreatedError] = useState<string | null>(null);

  // Delete recipe dialog
  const [recipeToDelete, setRecipeToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteRecipeVisible, setIsDeleteRecipeVisible] = useState(false);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [deleteRecipeError, setDeleteRecipeError] = useState<string | null>(null);

  // ── Load groups ────────────────────────────────────────────────────────────
  // `silent` skips the loading spinner (used by pull-to-refresh, which keeps the
  // old content visible and shows only the RefreshControl spinner).
  const loadGroups = useCallback(async (page: number, silent = false) => {
    if (!silent) setIsLoadingGroups(true);
    setGroupsError(null);
    try {
      const data = await getGroups(GROUPS_PER_PAGE, 4, page * GROUPS_PER_PAGE);
      // The /groups endpoint returns empty recipes; fetch each group's recipes
      // (and real count) from the dedicated /groups/{id}/recipes endpoint.
      const withRecipes = await Promise.all(
        data.map(async (group) => {
          try {
            const { recipes, totalItems } = await getGroupRecipes(group.groupId, 4, 0);
            return { ...group, recipes, totalRecipes: totalItems };
          } catch {
            return group;
          }
        })
      );
      setGroups(withRecipes);
      setGroupsPage(page);
      setHasMoreGroups(data.length === GROUPS_PER_PAGE);
    } catch {
      setGroupsError('No se pudieron cargar tus grupos.');
    } finally {
      if (!silent) setIsLoadingGroups(false);
    }
  }, []);

  useEffect(() => { loadGroups(0); }, [loadGroups]);

  // ── Load created recipes ─────────────────────────────────────────────────────
  const loadCreatedRecipes = useCallback(async (append: boolean, silent = false) => {
    if (!silent) { if (append) setIsLoadingMoreCreated(true); else setIsLoadingCreated(true); }
    setCreatedError(null);
    try {
      // When appending, use the current length as offset; otherwise start fresh.
      const offset = append ? createdRecipes.length : 0;
      const data = await getCreatedRecipes(CREATED_PER_PAGE, offset);
      setCreatedRecipes(prev => append ? [...prev, ...data.recipes] : data.recipes);
      setCreatedTotal(data.totalItems);
    } catch {
      setCreatedError('No se pudieron cargar tus recetas.');
    } finally {
      if (!silent) { if (append) setIsLoadingMoreCreated(false); else setIsLoadingCreated(false); }
    }
  }, [createdRecipes.length]);

  useEffect(() => { loadCreatedRecipes(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMoreCreated = createdRecipes.length < createdTotal;

  // Pull-to-refresh: reloads groups + created recipes silently (RefreshControl spinner only)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadGroups(0, true), loadCreatedRecipes(false, true)]);
    setIsRefreshing(false);
  }, [loadGroups, loadCreatedRecipes]);

  // Client-side search over loaded created recipes (the /recipes/created endpoint has no query param)
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const filteredCreatedRecipes = isSearching
    ? createdRecipes.filter(r =>
        r.name.toLowerCase().includes(normalizedQuery) ||
        r.origin.toLowerCase().includes(normalizedQuery) ||
        r.tags.some(t => t.toLowerCase().includes(normalizedQuery))
      )
    : createdRecipes;

  // ── Recipe detail ──────────────────────────────────────────────────────────
  // `group` is passed when the recipe is opened from inside a group, enabling
  // the "Quitar del grupo" action.
  const openRecipeDetail = async (recipeId: string, group?: { id: string; name: string }, canDelete = false) => {
    setDetailGroup(group ?? null);
    setDetailCanDelete(canDelete);
    setRemoveFromGroupError(null);
    setIsDetailVisible(true);
    setIsLoadingDetail(true);
    setDetailError(null);
    setSelectedRecipe(null);
    try {
      const recipe = await getRecipeById(recipeId);
      setSelectedRecipe(recipe);
    } catch {
      setDetailError('No se pudo cargar el detalle de la receta.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRemoveFromGroup = async () => {
    if (!selectedRecipe || !detailGroup) return;
    setIsRemovingFromGroup(true);
    setRemoveFromGroupError(null);
    try {
      await removeRecipeFromGroup(detailGroup.id, selectedRecipe.id);
      setIsDetailVisible(false);
      setDetailGroup(null);
      await loadGroups(groupsPage, true);
    } catch (err) {
      console.error('[removeRecipeFromGroup]', err instanceof Error ? err.message : err);
      setRemoveFromGroupError('No se pudo quitar la receta del grupo. Intenta de nuevo.');
    } finally {
      setIsRemovingFromGroup(false);
    }
  };

  // ── Group detail pagination ────────────────────────────────────────────────
  const loadGroupDetailPage = useCallback(async (groupId: string, page: number) => {
    setIsLoadingGroupDetail(true);
    try {
      const { recipes } = await getGroupRecipes(groupId, GROUP_DETAIL_LIMIT, (page - 1) * GROUP_DETAIL_LIMIT);
      setGroupDetailRecipes(recipes);
      setGroupDetailPage(page);
      setGroupDetailHasMore(recipes.length === GROUP_DETAIL_LIMIT);
    } catch {
      setGroupDetailRecipes([]);
    } finally {
      setIsLoadingGroupDetail(false);
    }
  }, []);

  const openGroupDetail = async (group: RecipeGroup) => {
    setExpandedGroup(group);
    setGroupDetailPage(1);
    setGroupDetailRecipes([]);
    setIsGroupDialogVisible(true);
    await loadGroupDetailPage(group.groupId, 1);
  };

  // ── Create group ───────────────────────────────────────────────────────────
  const dismissCreateGroup = () => {
    setIsCreateGroupVisible(false);
    setCreateGroupError(null);
    setGroupFormName('');
    setGroupFormDescription('');
  };

  const handleCreateGroup = async () => {
    const name = groupFormName.trim();
    const description = groupFormDescription.trim() || null;
    if (!name) return;
    setIsCreatingGroup(true);
    setCreateGroupError(null);
    try {
      await createGroup(name, description);
      dismissCreateGroup();
      await loadGroups(0);
    } catch {
      setCreateGroupError('No se pudo crear el grupo. Intenta de nuevo.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // ── Delete group ───────────────────────────────────────────────────────────
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    setIsDeletingGroup(true);
    setDeleteGroupError(null);
    try {
      await deleteGroup(groupToDelete.groupId);
      setIsDeleteDialogVisible(false);
      setGroupToDelete(null);
      // If we deleted the last item on a non-first page, go back one page
      const nextPage = groups.length === 1 && groupsPage > 0 ? groupsPage - 1 : groupsPage;
      await loadGroups(nextPage);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[deleteGroup]', msg);
      setDeleteGroupError('No se pudo eliminar el grupo. Intenta de nuevo.');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // ── Delete recipe ──────────────────────────────────────────────────────────
  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    setIsDeletingRecipe(true);
    setDeleteRecipeError(null);
    try {
      await deleteRecipe(recipeToDelete.id);
      setIsDeleteRecipeVisible(false);
      setRecipeToDelete(null);
      await loadCreatedRecipes(false);
      // The deleted recipe may have belonged to a group, so refresh groups too
      await loadGroups(groupsPage);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[deleteRecipe]', msg);
      setDeleteRecipeError('No se pudo eliminar la receta. Intenta de nuevo.');
    } finally {
      setIsDeletingRecipe(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <HomeScreenShell
      title="Tu librería"
      subtitle="Recetas guardadas y listas para volver a cocinar"
      searchPlaceholder="Buscar en mis recetas"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Button
          mode="contained"
          icon="folder-plus"
          onPress={() => setIsCreateGroupVisible(true)}
          style={styles.actionBtn}
          contentStyle={styles.actionBtnContent}
          labelStyle={styles.actionBtnLabel}
        >
          Crear grupo
        </Button>
        <Button
          mode="outlined"
          icon="chef-hat"
          onPress={() => setIsCreateRecipeVisible(true)}
          style={styles.actionBtn}
          contentStyle={styles.actionBtnContent}
          labelStyle={styles.actionBtnLabel}
        >
          Crear receta
        </Button>
      </View>

      {/* Groups content (hidden while searching) */}
      {!isSearching && (isLoadingGroups ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.mutedText}>Cargando tus grupos...</Text>
        </View>
      ) : groupsError ? (
        <Text variant="bodySmall" style={styles.mutedText}>{groupsError}</Text>
      ) : groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>Sin grupos aún</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Crea grupos para organizar tus recetas favoritas
          </Text>
        </View>
      ) : (
        <>
          {groups.map((group) => (
            <View key={group.groupId} style={styles.groupBlock}>
              {/* Group header: name + recipe count + divider + delete */}
              <View style={styles.groupHeader}>
                <Text variant="titleMedium" style={styles.groupName}>{group.groupName}</Text>
                {group.totalRecipes > 0 && (
                  <Text variant="labelSmall" style={[styles.groupCount, { color: theme.colors.onSurfaceVariant }]}>
                    {group.totalRecipes}
                  </Text>
                )}
                <View style={[styles.groupDivider, { backgroundColor: theme.colors.outlineVariant }]} />
                <IconButton
                  icon="delete-outline"
                  size={18}
                  iconColor={theme.colors.error}
                  onPress={() => { setGroupToDelete(group); setIsDeleteDialogVisible(true); }}
                  style={styles.deleteBtn}
                />
              </View>

              {/* Recipes horizontal scroll */}
              {group.recipes.length === 0 ? (
                <Text variant="bodySmall" style={[styles.mutedText, { paddingVertical: 8 }]}>
                  Sin recetas en este grupo
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardScroll}
                >
                  {group.recipes.map((recipe) => (
                    <RecipePreviewCard
                      key={recipe.id}
                      title={recipe.name}
                      creator={recipe.origin}
                      badge={recipe.tags[0] ?? ''}
                      thumbnailUrl={recipe.thumbnailUrl ?? undefined}
                      variant="compact"
                      containerStyle={styles.groupCard}
                      onPress={() => openRecipeDetail(recipe.id, { id: group.groupId, name: group.groupName })}
                    />
                  ))}
                </ScrollView>
              )}

              <Button
                mode="outlined"
                icon="chevron-down"
                compact
                onPress={() => openGroupDetail(group)}
                style={styles.seeMoreBtn}
                labelStyle={styles.seeMoreLabel}
              >
                Ver más recetas
              </Button>
            </View>
          ))}

          {/* Groups pagination */}
          {(groupsPage > 0 || hasMoreGroups) && (
            <View style={styles.paginationRow}>
              <IconButton
                icon="chevron-left"
                size={20}
                mode="contained-tonal"
                disabled={groupsPage === 0 || isLoadingGroups}
                onPress={() => loadGroups(groupsPage - 1)}
                style={styles.paginationArrow}
              />
              <Text variant="bodyMedium" style={styles.pageLabel}>Página {groupsPage + 1}</Text>
              <IconButton
                icon="chevron-right"
                size={20}
                mode="contained-tonal"
                disabled={!hasMoreGroups || isLoadingGroups}
                onPress={() => loadGroups(groupsPage + 1)}
                style={styles.paginationArrow}
              />
            </View>
          )}
        </>
      ))}

      {/* Created recipes section */}
      <SectionHeader
        title={isSearching ? 'Resultados' : 'Mis recetas'}
        subtitle={
          isSearching
            ? `Filtrando "${searchQuery.trim()}" en mis recetas`
            : createdTotal > 0 ? `${createdTotal} en total` : 'Las recetas que has creado'
        }
      />
      {isLoadingCreated ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.mutedText}>Cargando tus recetas...</Text>
        </View>
      ) : createdError ? (
        <Text variant="bodySmall" style={styles.mutedText}>{createdError}</Text>
      ) : createdRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>Aún no has creado recetas</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Usa el botón &quot;Crear receta&quot; para empezar
          </Text>
        </View>
      ) : isSearching && filteredCreatedRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>Sin coincidencias</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Ninguna receta cargada coincide con &quot;{searchQuery.trim()}&quot;.
            {hasMoreCreated ? ' Carga más para ampliar la búsqueda.' : ''}
          </Text>
          {hasMoreCreated && (
            <Button
              mode="outlined"
              icon="chevron-down"
              loading={isLoadingMoreCreated}
              disabled={isLoadingMoreCreated}
              onPress={() => loadCreatedRecipes(true)}
              style={styles.loadMoreBtn}
            >
              Cargar más
            </Button>
          )}
        </View>
      ) : (
        <>
          <View style={styles.createdGrid}>
            {filteredCreatedRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.createdGridItem}>
                <RecipePreviewCard
                  title={recipe.name}
                  creator={recipe.origin}
                  badge={recipe.tags[0] ?? ''}
                  thumbnailUrl={recipe.thumbnailUrl ?? undefined}
                  variant="compact"
                  onPress={() => openRecipeDetail(recipe.id, undefined, true)}
                />
              </View>
            ))}
          </View>
          {hasMoreCreated && (
            <Button
              mode="outlined"
              icon="chevron-down"
              loading={isLoadingMoreCreated}
              disabled={isLoadingMoreCreated}
              onPress={() => loadCreatedRecipes(true)}
              style={styles.loadMoreBtn}
            >
              {isSearching ? 'Cargar más para buscar' : 'Ver más'}
            </Button>
          )}
        </>
      )}

      {/* Create recipe modal */}
      <CreateRecipeModal
        visible={isCreateRecipeVisible}
        onDismiss={() => setIsCreateRecipeVisible(false)}
        onSuccess={() => { loadGroups(groupsPage); loadCreatedRecipes(false); }}
      />

      {/* ── Portals ── */}

      {/* Delete group confirmation */}
      <Portal>
        <Dialog
          visible={isDeleteDialogVisible}
          onDismiss={() => { setIsDeleteDialogVisible(false); setDeleteGroupError(null); }}
          style={styles.dialog}
        >
          <Dialog.Title>Eliminar grupo</Dialog.Title>
          <Dialog.Content style={styles.deleteContent}>
            <Text variant="bodyMedium">
              ¿Eliminar el grupo{' '}
              <Text style={{ fontWeight: '700' }}>{groupToDelete?.groupName}</Text>?
              Esta acción no se puede deshacer.
            </Text>
            {deleteGroupError ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
                {deleteGroupError}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => { setIsDeleteDialogVisible(false); setDeleteGroupError(null); }}
              disabled={isDeletingGroup}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              loading={isDeletingGroup}
              disabled={isDeletingGroup}
              onPress={handleDeleteGroup}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete recipe confirmation */}
      <Portal>
        <Dialog
          visible={isDeleteRecipeVisible}
          onDismiss={() => { setIsDeleteRecipeVisible(false); setDeleteRecipeError(null); }}
          style={styles.dialog}
        >
          <Dialog.Title>Eliminar receta</Dialog.Title>
          <Dialog.Content style={styles.deleteContent}>
            <Text variant="bodyMedium">
              ¿Eliminar la receta{' '}
              <Text style={{ fontWeight: '700' }}>{recipeToDelete?.name}</Text>?
              Esta acción no se puede deshacer.
            </Text>
            {deleteRecipeError ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
                {deleteRecipeError}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => { setIsDeleteRecipeVisible(false); setDeleteRecipeError(null); }}
              disabled={isDeletingRecipe}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              loading={isDeletingRecipe}
              disabled={isDeletingRecipe}
              onPress={handleDeleteRecipe}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Create group dialog */}
      <Portal>
        <Dialog visible={isCreateGroupVisible} onDismiss={dismissCreateGroup} style={styles.dialog}>
          <Dialog.Title>Nuevo grupo</Dialog.Title>
          <Dialog.Content style={styles.createGroupContent}>
            <TextInput
              mode="outlined"
              label="Nombre *"
              value={groupFormName}
              onChangeText={setGroupFormName}
              maxLength={60}
              left={<TextInput.Icon icon="folder-outline" />}
            />
            <TextInput
              mode="outlined"
              label="Descripción (opcional)"
              value={groupFormDescription}
              onChangeText={setGroupFormDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
              left={<TextInput.Icon icon="text" />}
            />
            {createGroupError ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>{createGroupError}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dismissCreateGroup} disabled={isCreatingGroup}>Cancelar</Button>
            <Button
              mode="contained"
              loading={isCreatingGroup}
              disabled={isCreatingGroup || groupFormName.trim().length === 0}
              onPress={handleCreateGroup}
              style={styles.createGroupSubmit}
            >
              Crear
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Group detail dialog */}
      <Portal>
        <Dialog
          visible={isGroupDialogVisible}
          onDismiss={() => setIsGroupDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{expandedGroup?.groupName ?? 'Recetas del grupo'}</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: screenHeight * 0.52 }} showsVerticalScrollIndicator>
              {isLoadingGroupDetail ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.mutedText}>Cargando recetas...</Text>
                </View>
              ) : groupDetailRecipes.length === 0 ? (
                <Text variant="bodyMedium" style={styles.mutedText}>Sin recetas disponibles</Text>
              ) : (
                <View style={styles.taggedList}>
                  {groupDetailRecipes.map((recipe) => (
                    <TaggedRecipeItem
                      key={recipe.id}
                      title={recipe.name}
                      creator={recipe.origin}
                      tag={recipe.tags[0] ?? ''}
                      thumbnailUrl={recipe.thumbnailUrl}
                      onPress={() => {
                        setIsGroupDialogVisible(false);
                        openRecipeDetail(
                          recipe.id,
                          expandedGroup ? { id: expandedGroup.groupId, name: expandedGroup.groupName } : undefined
                        );
                      }}
                    />
                  ))}
                </View>
              )}
            </ScrollView>

            {!isLoadingGroupDetail && (groupDetailPage > 1 || groupDetailHasMore) && (
              <View style={[styles.paginationRow, { marginTop: 12 }]}>
                <IconButton
                  icon="chevron-left"
                  size={18}
                  mode="contained-tonal"
                  disabled={groupDetailPage === 1}
                  onPress={() => expandedGroup && loadGroupDetailPage(expandedGroup.groupId, groupDetailPage - 1)}
                  style={styles.paginationArrow}
                />
                <Text variant="bodyMedium" style={styles.pageLabel}>Página {groupDetailPage}</Text>
                <IconButton
                  icon="chevron-right"
                  size={18}
                  mode="contained-tonal"
                  disabled={!groupDetailHasMore}
                  onPress={() => expandedGroup && loadGroupDetailPage(expandedGroup.groupId, groupDetailPage + 1)}
                  style={styles.paginationArrow}
                />
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsGroupDialogVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Recipe detail dialog */}
      <Portal>
        <Dialog visible={isDetailVisible} onDismiss={() => setIsDetailVisible(false)} style={styles.dialog}>
          <Dialog.Title>Detalle de receta</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: screenHeight * 0.55 }} showsVerticalScrollIndicator>
              {isLoadingDetail ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.mutedText}>Cargando detalle...</Text>
                </View>
              ) : null}
              {detailError ? <Text variant="bodyMedium">{detailError}</Text> : null}
              {selectedRecipe ? (
                <>
                  <Text variant="titleLarge" style={styles.detailTitle}>{selectedRecipe.name}</Text>
                  <Text variant="bodySmall" style={styles.detailMeta}>Origen: {selectedRecipe.origin}</Text>
                  <Text variant="bodySmall" style={styles.detailMeta}>
                    Tags: {selectedRecipe.tags.length ? selectedRecipe.tags.join(', ') : 'Sin tags'}
                  </Text>
                  {selectedRecipe.description ? (
                    <Text variant="bodyMedium" style={styles.detailParagraph}>{selectedRecipe.description}</Text>
                  ) : null}
                  <Text variant="titleMedium" style={styles.detailSectionTitle}>Ingredientes</Text>
                  {selectedRecipe.ingredients.length ? (
                    selectedRecipe.ingredients.map(ing => (
                      <Text key={`${ing.name}-${ing.amount}`} variant="bodySmall" style={styles.detailLine}>
                        - {ing.name}: {ing.amount}
                      </Text>
                    ))
                  ) : (
                    <Text variant="bodySmall" style={styles.detailLine}>Sin ingredientes disponibles.</Text>
                  )}
                  <Text variant="titleMedium" style={styles.detailSectionTitle}>Instrucciones</Text>
                  <Text variant="bodySmall" style={styles.detailParagraph}>
                    {selectedRecipe.instructions || 'Sin instrucciones disponibles.'}
                  </Text>
                </>
              ) : null}
            </ScrollView>
            {removeFromGroupError ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
                {removeFromGroupError}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions style={styles.detailActions}>
            {selectedRecipe && (
              <Button
                icon="folder-plus-outline"
                compact
                disabled={isRemovingFromGroup}
                onPress={() => {
                  setAddToGroupRecipe({ id: selectedRecipe.id, name: selectedRecipe.name });
                  setIsDetailVisible(false);
                }}
              >
                Añadir
              </Button>
            )}
            {detailGroup && selectedRecipe && (
              <Button
                icon="folder-remove-outline"
                compact
                textColor={theme.colors.error}
                loading={isRemovingFromGroup}
                disabled={isRemovingFromGroup}
                onPress={handleRemoveFromGroup}
              >
                Quitar
              </Button>
            )}
            {detailCanDelete && selectedRecipe && (
              <Button
                icon="delete-outline"
                compact
                textColor={theme.colors.error}
                onPress={() => {
                  setRecipeToDelete({ id: selectedRecipe.id, name: selectedRecipe.name });
                  setIsDeleteRecipeVisible(true);
                  setIsDetailVisible(false);
                }}
              >
                Eliminar
              </Button>
            )}
            <Button compact onPress={() => setIsDetailVisible(false)} disabled={isRemovingFromGroup}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <AddToGroupDialog
        visible={addToGroupRecipe !== null}
        recipeId={addToGroupRecipe?.id ?? null}
        recipeName={addToGroupRecipe?.name}
        onDismiss={() => {
          setAddToGroupRecipe(null);
          // Reflect the new membership when returning to the library
          loadGroups(groupsPage, true);
        }}
      />
    </HomeScreenShell>
  );
};

const styles = StyleSheet.create({
  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 18 },
  actionBtnContent: { paddingVertical: 2 },
  actionBtnLabel: { fontWeight: '700', fontSize: 13 },
  // States
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  mutedText: { opacity: 0.72 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontWeight: '700' },
  emptySubtitle: { opacity: 0.65, textAlign: 'center' },
  // Group block
  groupBlock: { gap: 10 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupName: { fontWeight: '700', flexShrink: 0 },
  groupCount: { opacity: 0.6, flexShrink: 0 },
  groupDivider: { flex: 1, height: StyleSheet.hairlineWidth },
  deleteBtn: { margin: 0 },
  cardScroll: { gap: 12, paddingHorizontal: 2 },
  groupCard: { width: 155 },
  seeMoreBtn: { borderRadius: 18, alignSelf: 'flex-start' },
  seeMoreLabel: { fontWeight: '600', fontSize: 13 },
  // Created recipes grid
  createdGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  createdGridItem: { width: '48%', marginBottom: 12 },
  loadMoreBtn: { borderRadius: 18, alignSelf: 'center', marginTop: 4 },
  // Pagination
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 },
  paginationArrow: { margin: 0 },
  pageLabel: { fontWeight: '600', minWidth: 70, textAlign: 'center' },
  // Dialogs
  dialog: { borderRadius: 20 },
  deleteContent: { gap: 4 },
  createGroupContent: { gap: 14 },
  // Wrap to a second row instead of squashing when 3 actions don't fit
  detailActions: { flexWrap: 'wrap' },
  createGroupSubmit: { borderRadius: 12 },
  taggedList: { gap: 12 },
  // Recipe detail
  detailTitle: { fontWeight: '700', marginBottom: 6 },
  detailMeta: { opacity: 0.75, marginBottom: 2 },
  detailSectionTitle: { fontWeight: '700', marginTop: 12, marginBottom: 4 },
  detailParagraph: { opacity: 0.9, marginTop: 8 },
  detailLine: { opacity: 0.85, marginBottom: 2 },
});
