import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomNavigation, Button, Chip, Dialog, IconButton, Portal, Text, useTheme } from 'react-native-paper';

import { AddToGroupDialog } from '@/components/home/add-to-group-dialog';
import { HistoryScene } from '@/components/home/history-scene';
import { LibraryScene } from '@/components/home/library-scene';
import { HomeScreenShell } from '@/components/home/home-screen-shell';
import { RecipePreviewCard } from '@/components/home/recipe-preview-card';
import { SectionHeader } from '@/components/home/section-header';
import { TaggedRecipeItem } from '@/components/home/tagged-recipe-item';
import { getLatestRecipes, getPopularRecipes, getRecipeById, getTopTags, searchRecipes, type LatestRecipeCardData, type RecipeDetail, type SearchRecipeItem, type TopTagsRecipeItem } from '@/services/recipes';

type RouteKey = 'library' | 'history' | 'explore';



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

  // Add-to-group dialog
  const [addToGroupRecipe, setAddToGroupRecipe] = useState<{ id: string; name: string } | null>(null);

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

  // Loaders extraídos para reusarlos en la carga inicial y en pull-to-refresh.
  // `silent` omite el spinner de carga (refresh muestra solo el RefreshControl).
  const loadLatestRecipes = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingLatest(true);
    setLatestError(null);
    try {
      const recipes = await getLatestRecipes(4);
      setLatestRecipes(recipes);
    } catch {
      setLatestRecipes(exploreSections.recentFallback.map((item, index) => ({
        id: `fallback-${index}`, title: item.title, creator: item.creator, badge: item.tag,
      })));
      setLatestError('No se pudo cargar el backend, mostrando datos de ejemplo.');
    } finally {
      if (!silent) setIsLoadingLatest(false);
    }
  }, []);

  const loadPopularRecipes = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingPopular(true);
    setPopularError(null);
    try {
      const recipes = await getPopularRecipes(4);
      setPopularRecipes(recipes);
    } catch {
      setPopularRecipes(exploreSections.viewed.map((item, index) => ({
        id: `popular-fallback-${index}`, title: item.title, creator: item.creator, badge: item.tag,
      })));
      setPopularError('No se pudo cargar recetas populares, mostrando datos de ejemplo.');
    } finally {
      if (!silent) setIsLoadingPopular(false);
    }
  }, []);

  const loadTopTags = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingTags(true);
    setTagsError(null);
    try {
      const data = await getTopTags(6, 4);
      setTopTags(data);
      const first = Object.keys(data)[0];
      if (first) setSelectedTag(prev => prev ?? first);
    } catch {
      setTagsError('No se pudieron cargar los tags.');
    } finally {
      if (!silent) setIsLoadingTags(false);
    }
  }, []);

  // Carga inicial de explorar
  useEffect(() => {
    loadLatestRecipes();
    loadPopularRecipes();
    loadTopTags();
  }, [loadLatestRecipes, loadPopularRecipes, loadTopTags]);

  // Pull-to-refresh: recarga las 3 secciones en silencio
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadLatestRecipes(true), loadPopularRecipes(true), loadTopTags(true)]);
    setIsRefreshing(false);
  }, [loadLatestRecipes, loadPopularRecipes, loadTopTags]);

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
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
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
            {selectedRecipe && (
              <Button
                icon="folder-plus-outline"
                onPress={() => {
                  setAddToGroupRecipe({ id: selectedRecipe.id, name: selectedRecipe.name });
                  setIsDetailVisible(false);
                }}
              >
                Añadir a grupo
              </Button>
            )}
            <Button onPress={() => setIsDetailVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <AddToGroupDialog
        visible={addToGroupRecipe !== null}
        recipeId={addToGroupRecipe?.id ?? null}
        recipeName={addToGroupRecipe?.name}
        onDismiss={() => setAddToGroupRecipe(null)}
      />
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
});