import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomNavigation, Button, Chip, Dialog, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';

import { HistorySearchItem } from '@/components/home/history-search-item';
import { HomeScreenShell } from '@/components/home/home-screen-shell';
import { RecipePreviewCard } from '@/components/home/recipe-preview-card';
import { SectionHeader } from '@/components/home/section-header';
import { TaggedRecipeItem } from '@/components/home/tagged-recipe-item';
import { createGroup, getGroupRecipes, getGroups, getLatestRecipes, getPopularRecipes, getRecipeById, getTopTags, searchRecipes, type GroupRecipeItem, type LatestRecipeCardData, type RecipeDetail, type RecipeGroup, type SearchRecipeItem, type TopTagsRecipeItem } from '@/services/recipes';

type RouteKey = 'library' | 'history' | 'explore';


const historySearches = [
  { query: 'receta con pollo y arroz', ago: 'Hace 12 min', kind: 'Búsqueda' },
  { query: 'postres sin horno', ago: 'Hace 1 h', kind: 'Exploración' },
  { query: 'salsa para pasta casera', ago: 'Ayer', kind: 'Búsqueda' },
  { query: 'desayunos saludables', ago: 'Ayer', kind: 'Exploración' },
];

const exploreSections = {
  recentFallback: [
    { title: 'Tostadas de aguacate', creator: 'Chef Luna', tag: 'Desayuno' },
    { title: 'Bowl mediterráneo', creator: 'Nora Cocina', tag: 'Saludable' },
    { title: 'Pan de plátano', creator: 'Majo Bakes', tag: 'Postre' },
    { title: 'Pollo al ajo', creator: 'Kitchen Club', tag: 'Cena' },
  ],
  viewed: [
    { title: 'Hamburguesa smash', creator: 'Fuego Lab', tag: 'Popular' },
    { title: 'Risotto de hongos', creator: 'Cocina de Ana', tag: 'Top' },
    { title: 'Tarta de frutos rojos', creator: 'Dulce Norte', tag: 'Trending' },
  ],
};

const SEARCH_LIMIT = 6;

const getPageWindow = (current: number, total: number): (number | string)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  if (start > 1) { pages.push(1); if (start > 2) pages.push('ellipsis-start'); }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total) { if (end < total - 1) pages.push('ellipsis-end'); pages.push(total); }
  return pages;
};

const libraryRoutes = [
  { key: 'library', title: 'Librería', focusedIcon: 'bookshelf', unfocusedIcon: 'bookshelf' },
  { key: 'history', title: 'Historial', focusedIcon: 'history', unfocusedIcon: 'history' },
  { key: 'explore', title: 'Explorar', focusedIcon: 'compass', unfocusedIcon: 'compass-outline' },
] as const;

const GROUPS_PER_PAGE = 4;
const GROUP_DETAIL_LIMIT = 8;

const LibraryScene = () => {
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  const [groups, setGroups] = useState<RecipeGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [groupsPage, setGroupsPage] = useState(0);

  const [isGroupDialogVisible, setIsGroupDialogVisible] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<RecipeGroup | null>(null);
  const [groupDetailRecipes, setGroupDetailRecipes] = useState<GroupRecipeItem[]>([]);
  const [groupDetailPage, setGroupDetailPage] = useState(1);
  const [groupDetailHasMore, setGroupDetailHasMore] = useState(false);
  const [isLoadingGroupDetail, setIsLoadingGroupDetail] = useState(false);

  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);

  const [isCreateGroupVisible, setIsCreateGroupVisible] = useState(false);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormDescription, setGroupFormDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  const totalGroupPages = Math.ceil(groups.length / GROUPS_PER_PAGE);
  const visibleGroups = groups.slice(groupsPage * GROUPS_PER_PAGE, (groupsPage + 1) * GROUPS_PER_PAGE);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoadingGroups(true);
        setGroupsError(null);
        const data = await getGroups(20, 4);
        if (isMounted) setGroups(data);
      } catch {
        if (isMounted) setGroupsError('No se pudieron cargar tus grupos de recetas.');
      } finally {
        if (isMounted) setIsLoadingGroups(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const openRecipeDetail = async (recipeId: string) => {
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

  const loadGroupDetailPage = useCallback(async (groupId: string, page: number) => {
    setIsLoadingGroupDetail(true);
    const offset = (page - 1) * GROUP_DETAIL_LIMIT;
    try {
      const recipes = await getGroupRecipes(groupId, GROUP_DETAIL_LIMIT, offset);
      setGroupDetailRecipes(recipes);
      setGroupDetailPage(page);
      setGroupDetailHasMore(recipes.length === GROUP_DETAIL_LIMIT);
    } catch {
      setGroupDetailRecipes([]);
    } finally {
      setIsLoadingGroupDetail(false);
    }
  }, []);

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
      const data = await getGroups(20, 4);
      setGroups(data);
      setGroupsPage(0);
    } catch {
      setCreateGroupError('No se pudo crear el grupo. Intenta de nuevo.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const openGroupDetail = async (group: RecipeGroup) => {
    setExpandedGroup(group);
    setGroupDetailPage(1);
    setGroupDetailRecipes([]);
    setIsGroupDialogVisible(true);
    await loadGroupDetailPage(group.groupId, 1);
  };

  return (
    <HomeScreenShell
      title="Tu librería"
      subtitle="Recetas guardadas y listas para volver a cocinar"
      searchPlaceholder="Buscar en tu librería"
    >
      <View style={styles.actionRow}>
        <Button
          mode="contained"
          icon="folder-plus"
          onPress={() => setIsCreateGroupVisible(true)}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
        >
          Crear grupo
        </Button>
        <Button
          mode="outlined"
          icon="chef-hat"
          disabled
          onPress={() => {}}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
        >
          Crear receta
        </Button>
      </View>

      {isLoadingGroups ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>Cargando tus grupos...</Text>
        </View>
      ) : groupsError ? (
        <Text variant="bodySmall" style={styles.errorText}>{groupsError}</Text>
      ) : groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>Sin grupos aún</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Crea grupos para organizar tus recetas favoritas
          </Text>
        </View>
      ) : (
        <>
          {visibleGroups.map((group) => (
            <View key={group.groupId} style={styles.groupBlock}>
              <View style={styles.groupHeader}>
                <Text variant="titleMedium" style={styles.groupName}>{group.groupName}</Text>
                <View style={[styles.groupDivider, { backgroundColor: theme.colors.outlineVariant }]} />
              </View>

              {group.recipes.length === 0 ? (
                <Text variant="bodySmall" style={[styles.loadingText, { paddingVertical: 8 }]}>
                  Sin recetas en este grupo
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.groupCardScroll}
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
                      onPress={() => openRecipeDetail(recipe.id)}
                    />
                  ))}
                </ScrollView>
              )}

              <Button
                mode="outlined"
                icon="chevron-down"
                compact
                onPress={() => openGroupDetail(group)}
                style={styles.seeMoreButton}
                labelStyle={styles.seeMoreLabel}
              >
                Ver más recetas
              </Button>
            </View>
          ))}

          {totalGroupPages > 1 && (
            <View style={styles.paginationRow}>
              <IconButton
                icon="chevron-left"
                size={20}
                mode="contained-tonal"
                disabled={groupsPage === 0}
                onPress={() => setGroupsPage(p => p - 1)}
                style={styles.paginationArrow}
              />
              <View style={styles.pageNumbers}>
                {Array.from({ length: totalGroupPages }, (_, i) => (
                  <Chip
                    key={i}
                    selected={i === groupsPage}
                    compact
                    onPress={() => setGroupsPage(i)}
                    style={styles.pageChip}
                    textStyle={styles.pageChipText}
                  >
                    {String(i + 1)}
                  </Chip>
                ))}
              </View>
              <IconButton
                icon="chevron-right"
                size={20}
                mode="contained-tonal"
                disabled={groupsPage === totalGroupPages - 1}
                onPress={() => setGroupsPage(p => p + 1)}
                style={styles.paginationArrow}
              />
            </View>
          )}
        </>
      )}

      {/* Dialog: crear grupo */}
      <Portal>
        <Dialog visible={isCreateGroupVisible} onDismiss={dismissCreateGroup} style={styles.detailDialog}>
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
              <Text variant="bodySmall" style={styles.errorText}>{createGroupError}</Text>
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

      {/* Dialog: lista de recetas del grupo */}
      <Portal>
        <Dialog
          visible={isGroupDialogVisible}
          onDismiss={() => setIsGroupDialogVisible(false)}
          style={styles.detailDialog}
        >
          <Dialog.Title>{expandedGroup?.groupName ?? 'Recetas del grupo'}</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: screenHeight * 0.52 }} showsVerticalScrollIndicator>
              {isLoadingGroupDetail ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.loadingText}>Cargando recetas...</Text>
                </View>
              ) : groupDetailRecipes.length === 0 ? (
                <Text variant="bodyMedium" style={styles.noResults}>Sin recetas disponibles</Text>
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
                        openRecipeDetail(recipe.id);
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
                <Text variant="bodyMedium" style={styles.pageChipText}>Página {groupDetailPage}</Text>
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

      {/* Dialog: detalle de receta individual */}
      <Portal>
        <Dialog visible={isDetailVisible} onDismiss={() => setIsDetailVisible(false)} style={styles.detailDialog}>
          <Dialog.Title>Detalle de receta</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: screenHeight * 0.55 }} showsVerticalScrollIndicator>
              {isLoadingDetail ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.loadingText}>Cargando detalle...</Text>
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
                    selectedRecipe.ingredients.map((ingredient) => (
                      <Text key={`${ingredient.name}-${ingredient.amount}`} variant="bodySmall" style={styles.detailLine}>
                        - {ingredient.name}: {ingredient.amount}
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDetailVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </HomeScreenShell>
  );
};

const HistoryScene = () => {
  return (
    <HomeScreenShell
      title="Historial"
      subtitle="Últimas búsquedas relacionadas con tus recetas"
      searchPlaceholder="Buscar en historial"
    >
      <SectionHeader title="Busquedas recientes" subtitle="Lo último que consultaste" />

      <View style={styles.historyList}>
        {historySearches.map((item) => (
          <HistorySearchItem key={`${item.query}-${item.ago}`} {...item} />
        ))}
      </View>
    </HomeScreenShell>
  );
};

const ExploreScene = () => {
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  // Explore data
  const [latestRecipes, setLatestRecipes] = useState<LatestRecipeCardData[]>([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [popularRecipes, setPopularRecipes] = useState<LatestRecipeCardData[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [topTags, setTopTags] = useState<Record<string, TopTagsRecipeItem[]>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // Recipe detail
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchRecipeItem[]>([]);
  const [searchSessionId, setSearchSessionId] = useState<string | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalItems, setSearchTotalItems] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isSearchActive = searchQuery.trim().length > 0;
  const isSearchLoading = isDebouncing || isSearching;
  const totalPages = Math.ceil(searchTotalItems / SEARCH_LIMIT);
  const latestGridRecipes = latestRecipes.slice(0, 4);

  const openRecipeDetail = async (recipeId: string) => {
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

  const executeSearch = useCallback(async (query: string, page: number, sessionId: string | null) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchRecipes(query, page, SEARCH_LIMIT, sessionId);
      setSearchResults(result.recipes);
      setSearchSessionId(result.meta.sessionId);
      setSearchTotalItems(result.meta.totalItems);
      setSearchPage(page);
    } catch {
      setSearchError('No se pudo realizar la búsqueda.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce: nueva búsqueda cuando cambia la query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setIsDebouncing(false);
      setSearchResults([]);
      setSearchSessionId(null);
      setSearchPage(1);
      setSearchTotalItems(0);
      return;
    }
    setIsDebouncing(true);
    const timeout = setTimeout(() => {
      setIsDebouncing(false);
      executeSearch(trimmed, 1, null);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, executeSearch]);

  // Carga inicial de explorar
  useEffect(() => {
    let isMounted = true;

    const loadLatestRecipes = async () => {
      try {
        setIsLoadingLatest(true);
        setLatestError(null);
        const recipes = await getLatestRecipes(4);
        if (isMounted) setLatestRecipes(recipes);
      } catch {
        if (isMounted) {
          setLatestRecipes(exploreSections.recentFallback.map((item, index) => ({
            id: `fallback-${index}`, title: item.title, creator: item.creator, badge: item.tag,
          })));
          setLatestError('No se pudo cargar el backend, mostrando datos de ejemplo.');
        }
      } finally {
        if (isMounted) setIsLoadingLatest(false);
      }
    };

    const loadPopularRecipes = async () => {
      try {
        setIsLoadingPopular(true);
        setPopularError(null);
        const recipes = await getPopularRecipes(4);
        if (isMounted) setPopularRecipes(recipes);
      } catch {
        if (isMounted) {
          setPopularRecipes(exploreSections.viewed.map((item, index) => ({
            id: `popular-fallback-${index}`, title: item.title, creator: item.creator, badge: item.tag,
          })));
          setPopularError('No se pudo cargar recetas populares, mostrando datos de ejemplo.');
        }
      } finally {
        if (isMounted) setIsLoadingPopular(false);
      }
    };

    const loadTopTags = async () => {
      try {
        setIsLoadingTags(true);
        setTagsError(null);
        const data = await getTopTags(6, 4);
        if (isMounted) {
          setTopTags(data);
          const first = Object.keys(data)[0];
          if (first) setSelectedTag(first);
        }
      } catch {
        if (isMounted) setTagsError('No se pudieron cargar los tags.');
      } finally {
        if (isMounted) setIsLoadingTags(false);
      }
    };

    loadLatestRecipes();
    loadPopularRecipes();
    loadTopTags();

    return () => { isMounted = false; };
  }, []);

  const handlePageChange = (page: number) => {
    executeSearch(searchQuery.trim(), page, searchSessionId);
  };

  return (
    <HomeScreenShell
      title="Explorar"
      subtitle="Descubre recetas de otros creadores"
      searchPlaceholder="Buscar recetas o creadores"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {isSearchActive ? (
        /* ── Vista de búsqueda ── */
        <>
          {isSearchLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>Buscando recetas...</Text>
            </View>
          ) : searchError ? (
            <Text variant="bodySmall" style={styles.errorText}>{searchError}</Text>
          ) : searchResults.length === 0 ? (
            <Text variant="bodyMedium" style={styles.noResults}>
              No encontramos recetas para "{searchQuery.trim()}"
            </Text>
          ) : (
            <>
              <SectionHeader
                title={`${searchTotalItems} resultado${searchTotalItems !== 1 ? 's' : ''}`}
                subtitle={`Para "${searchQuery.trim()}"`}
              />
              <View style={styles.compactGrid}>
                {searchResults.map(item => (
                  <View key={item.id} style={styles.compactGridItem}>
                    <RecipePreviewCard
                      title={item.name}
                      creator={item.origin}
                      badge={item.tags[0] ?? ''}
                      thumbnailUrl={item.thumbnailUrl ?? undefined}
                      variant="compact"
                      onPress={() => openRecipeDetail(item.id)}
                    />
                  </View>
                ))}
              </View>

              {totalPages > 1 && (
                <View style={styles.paginationRow}>
                  <IconButton
                    icon="chevron-left"
                    size={20}
                    mode="contained-tonal"
                    disabled={searchPage === 1 || isSearching}
                    onPress={() => handlePageChange(searchPage - 1)}
                    style={styles.paginationArrow}
                  />
                  <View style={styles.pageNumbers}>
                    {getPageWindow(searchPage, totalPages).map((p, idx) =>
                      typeof p === 'string' ? (
                        <Text key={`${p}-${idx}`} style={styles.pageEllipsis}>…</Text>
                      ) : (
                        <Chip
                          key={p}
                          selected={p === searchPage}
                          compact
                          onPress={() => { if (p !== searchPage) handlePageChange(p); }}
                          style={styles.pageChip}
                          textStyle={styles.pageChipText}
                        >
                          {String(p)}
                        </Chip>
                      )
                    )}
                  </View>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    mode="contained-tonal"
                    disabled={searchPage === totalPages || isSearching}
                    onPress={() => handlePageChange(searchPage + 1)}
                    style={styles.paginationArrow}
                  />
                </View>
              )}
            </>
          )}
        </>
      ) : (
        /* ── Vista normal de explorar ── */
        <>
          <SectionHeader title="Más recientes" subtitle="Contenido nuevo para empezar" />
          {isLoadingLatest ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>Cargando recetas recientes...</Text>
            </View>
          ) : (
            <>
              {latestError ? <Text variant="bodySmall" style={styles.errorText}>{latestError}</Text> : null}
              <View style={styles.compactGrid}>
                {latestGridRecipes.map((item) => (
                  <View key={item.id} style={styles.compactGridItem}>
                    <RecipePreviewCard
                      title={item.title}
                      creator={item.creator}
                      badge={item.badge}
                      thumbnailUrl={item.thumbnailUrl}
                      variant="compact"
                      onPress={() => openRecipeDetail(item.id)}
                    />
                  </View>
                ))}
              </View>
            </>
          )}

          <SectionHeader title="Más vistos" subtitle="Lo que más está llamando la atención" />
          {isLoadingPopular ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>Cargando recetas populares...</Text>
            </View>
          ) : (
            <>
              {popularError ? <Text variant="bodySmall" style={styles.errorText}>{popularError}</Text> : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {popularRecipes.map((item) => (
                  <RecipePreviewCard
                    key={item.id}
                    title={item.title}
                    creator={item.creator}
                    badge={item.badge}
                    thumbnailUrl={item.thumbnailUrl}
                    variant="featured"
                    containerStyle={styles.horizontalCardItem}
                    onPress={item.id.startsWith('popular-fallback-') ? undefined : () => openRecipeDetail(item.id)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          <SectionHeader title="Recetas por etiqueta" subtitle="Los tags más populares" />
          {isLoadingTags ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>Cargando etiquetas...</Text>
            </View>
          ) : (
            <>
              {tagsError ? (
                <Text variant="bodySmall" style={styles.errorText}>{tagsError}</Text>
              ) : (
                <>
                  <View style={styles.tagRow}>
                    {Object.keys(topTags).map((tag) => (
                      <Chip
                        key={tag}
                        selected={selectedTag === tag}
                        onPress={() => setSelectedTag(tag)}
                        style={styles.tagChip}
                        textStyle={styles.tagChipText}
                      >
                        {tag}
                      </Chip>
                    ))}
                  </View>
                  <View style={styles.taggedList}>
                    {(Array.isArray(topTags[selectedTag ?? '']) ? topTags[selectedTag ?? ''] : []).map((item) => (
                      <TaggedRecipeItem
                        key={item.id}
                        title={item.name}
                        creator={item.origin}
                        tag={selectedTag ?? ''}
                        thumbnailUrl={item.thumbnailUrl}
                        onPress={() => openRecipeDetail(item.id)}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Dialog siempre montado para ambos modos */}
      <Portal>
        <Dialog visible={isDetailVisible} onDismiss={() => setIsDetailVisible(false)} style={styles.detailDialog}>
          <Dialog.Title>Detalle de receta</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: screenHeight * 0.55 }} showsVerticalScrollIndicator>
              {isLoadingDetail ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.loadingText}>Cargando detalle...</Text>
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
                    selectedRecipe.ingredients.map((ingredient) => (
                      <Text key={`${ingredient.name}-${ingredient.amount}`} variant="bodySmall" style={styles.detailLine}>
                        - {ingredient.name}: {ingredient.amount}
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDetailVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </HomeScreenShell>
  );
};

export default function Home() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([...libraryRoutes]);
  const theme = useTheme();

  const renderScene = ({ route }: { route: { key: RouteKey } }) => {
    switch (route.key) {
      case 'library':
        return <LibraryScene />;
      case 'history':
        return <HistoryScene />;
      case 'explore':
        return <ExploreScene />;
      default:
        return null;
    }
  };

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      barStyle={[styles.bottomBar, { backgroundColor: theme.colors.elevation.level1, borderTopColor: theme.colors.outlineVariant }]}
      shifting={false}
    />
  );
}

const styles = StyleSheet.create({
  primaryActionWrap: {
    alignItems: 'flex-start',
  },
  primaryActionButton: {
    borderRadius: 18,
  },
  primaryActionLabel: {
    fontWeight: '700',
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyList: {
    gap: 12,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  compactGridItem: {
    width: '48%',
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 4,
    gap: 12,
  },
  horizontalCardItem: {
    width: 200,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    opacity: 0.72,
  },
  errorText: {
    opacity: 0.72,
  },
  detailDialog: {
    borderRadius: 20,
  },
  detailTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  detailMeta: {
    opacity: 0.75,
    marginBottom: 2,
  },
  detailSectionTitle: {
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  detailParagraph: {
    opacity: 0.9,
    marginTop: 8,
  },
  detailLine: {
    opacity: 0.85,
    marginBottom: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    borderRadius: 999,
  },
  tagChipText: {
    fontWeight: '600',
  },
  taggedList: {
    gap: 12,
  },
  noResults: {
    opacity: 0.7,
    textAlign: 'center',
    paddingVertical: 32,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  paginationArrow: {
    margin: 0,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 1,
  },
  pageChip: {
    borderRadius: 999,
    minWidth: 36,
  },
  pageChipText: {
    fontWeight: '600',
    fontSize: 13,
  },
  pageEllipsis: {
    opacity: 0.45,
    paddingHorizontal: 2,
    fontSize: 16,
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  // Library groups
  groupBlock: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupName: {
    fontWeight: '700',
    flexShrink: 0,
  },
  groupDivider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  groupCardScroll: {
    gap: 12,
    paddingHorizontal: 2,
  },
  groupCard: {
    width: 155,
  },
  seeMoreButton: {
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  seeMoreLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptySubtitle: {
    opacity: 0.65,
    textAlign: 'center',
  },
  // Action buttons row
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 18,
  },
  actionButtonContent: {
    paddingVertical: 2,
  },
  actionButtonLabel: {
    fontWeight: '700',
    fontSize: 13,
  },
  // Create group form
  createGroupContent: {
    gap: 14,
  },
  createGroupSubmit: {
    borderRadius: 12,
  },
});