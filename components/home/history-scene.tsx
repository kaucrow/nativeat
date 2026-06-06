import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';

import { HomeScreenShell } from '@/components/home/home-screen-shell';
import { SectionHeader } from '@/components/home/section-header';
import { TaggedRecipeItem } from '@/components/home/tagged-recipe-item';
import {
  getRecipeById,
  getRecipeHistory,
  type LatestRecipeCardData,
  type RecipeDetail,
} from '@/services/recipes';

const HISTORY_LIMIT = 10;

export const HistoryScene = () => {
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  const [recipes, setRecipes] = useState<LatestRecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);

  // Client-side search over the loaded history (the /recipes/history endpoint has no query param)
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const filteredRecipes = isSearching
    ? recipes.filter(r =>
        r.title.toLowerCase().includes(normalizedQuery) ||
        r.creator.toLowerCase().includes(normalizedQuery) ||
        r.badge.toLowerCase().includes(normalizedQuery)
      )
    : recipes;

  const loadHistory = useCallback(async (offset: number, append: boolean) => {
    if (append) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);
    try {
      const data = await getRecipeHistory(HISTORY_LIMIT, offset);
      setRecipes(prev => append ? [...prev, ...data] : data);
      setCurrentOffset(offset + data.length);
      setHasMore(data.length === HISTORY_LIMIT);
    } catch {
      setError('No se pudo cargar el historial.');
    } finally {
      if (append) setIsLoadingMore(false); else setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(0, false); }, [loadHistory]);

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

  return (
    <HomeScreenShell
      title="Historial"
      subtitle="Recetas que has visto recientemente"
      searchPlaceholder="Buscar en historial"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <SectionHeader
        title={isSearching ? 'Resultados' : 'Vistas recientemente'}
        subtitle={isSearching ? `Filtrando "${searchQuery.trim()}" en tu historial` : undefined}
      />

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.mutedText}>Cargando historial...</Text>
        </View>
      ) : error ? (
        <Text variant="bodySmall" style={styles.mutedText}>{error}</Text>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>Sin historial aún</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Las recetas que consultes aparecerán aquí
          </Text>
        </View>
      ) : isSearching && filteredRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>Sin coincidencias</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            No hay recetas cargadas que coincidan con &quot;{searchQuery.trim()}&quot;.
            {hasMore ? ' Carga más para ampliar la búsqueda.' : ''}
          </Text>
          {hasMore && (
            <Button
              mode="outlined"
              loading={isLoadingMore}
              disabled={isLoadingMore}
              onPress={() => loadHistory(currentOffset, true)}
              style={styles.loadMoreBtn}
              icon="chevron-down"
            >
              Cargar más
            </Button>
          )}
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {filteredRecipes.map(item => (
              <TaggedRecipeItem
                key={item.id}
                title={item.title}
                creator={item.creator}
                tag={item.badge}
                thumbnailUrl={item.thumbnailUrl}
                onPress={() => openRecipeDetail(item.id)}
              />
            ))}
          </View>

          {hasMore && (
            <Button
              mode="outlined"
              loading={isLoadingMore}
              disabled={isLoadingMore}
              onPress={() => loadHistory(currentOffset, true)}
              style={styles.loadMoreBtn}
              icon="chevron-down"
            >
              {isSearching ? 'Cargar más para buscar' : 'Cargar más'}
            </Button>
          )}
        </>
      )}

      <Portal>
        <Dialog
          visible={isDetailVisible}
          onDismiss={() => setIsDetailVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Detalle de receta</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: screenHeight * 0.55 }} showsVerticalScrollIndicator>
              {isLoadingDetail ? (
                <View style={styles.loadingState}>
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDetailVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </HomeScreenShell>
  );
};

const styles = StyleSheet.create({
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  mutedText: {
    opacity: 0.72,
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
  list: {
    gap: 12,
  },
  loadMoreBtn: {
    borderRadius: 18,
    alignSelf: 'center',
    marginTop: 4,
  },
  dialog: {
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
});
