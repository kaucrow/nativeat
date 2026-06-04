import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomNavigation, Button, Chip, useTheme } from 'react-native-paper';

import { HistorySearchItem } from '@/components/home/history-search-item';
import { HomeScreenShell } from '@/components/home/home-screen-shell';
import { LibraryRecipeCard } from '@/components/home/library-recipe-card';
import { RecipePreviewCard } from '@/components/home/recipe-preview-card';
import { SectionHeader } from '@/components/home/section-header';
import { TaggedRecipeItem } from '@/components/home/tagged-recipe-item';

type RouteKey = 'library' | 'history' | 'explore';

const libraryRecipes = [
  { title: 'Tacos de birria', time: '25 min', label: 'Favorita', accent: '#8E4D2D' },
  { title: 'Pasta cremosa', time: '18 min', label: 'Rápida', accent: '#B56D45' },
  { title: 'Sopa de tomate', time: '30 min', label: 'Casera', accent: '#C98463' },
  { title: 'Ensalada cítrica', time: '12 min', label: 'Ligera', accent: '#D7A07A' },
];

const historySearches = [
  { query: 'receta con pollo y arroz', ago: 'Hace 12 min', kind: 'Búsqueda' },
  { query: 'postres sin horno', ago: 'Hace 1 h', kind: 'Exploración' },
  { query: 'salsa para pasta casera', ago: 'Ayer', kind: 'Búsqueda' },
  { query: 'desayunos saludables', ago: 'Ayer', kind: 'Exploración' },
];

const exploreSections = {
  recent: [
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
  tagged: [
    { title: 'Empanadas de carne', creator: 'Recetas de casa', tag: 'tag' },
    { title: 'Sopa tailandesa', creator: 'Sabores del mundo', tag: 'tag' },
  ],
};

const libraryRoutes = [
  { key: 'library', title: 'Librería', focusedIcon: 'bookshelf', unfocusedIcon: 'bookshelf' },
  { key: 'history', title: 'Historial', focusedIcon: 'history', unfocusedIcon: 'history' },
  { key: 'explore', title: 'Explorar', focusedIcon: 'compass', unfocusedIcon: 'compass-outline' },
] as const;

const LibraryScene = () => {
  const theme = useTheme();

  return (
    <HomeScreenShell
      title="Tu librería"
      subtitle="Recetas guardadas y listas para volver a cocinar"
      searchPlaceholder="Buscar en tu librería"
    >
      <View style={styles.primaryActionWrap}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => {}}
          style={[styles.primaryActionButton, { backgroundColor: theme.colors.primary }]}
          labelStyle={styles.primaryActionLabel}
        >
          Agregar receta
        </Button>
      </View>

      <SectionHeader title="Mis recetas" subtitle="Vista preliminar de cómo se vería la biblioteca" />

      <View style={styles.recipeGrid}>
        {libraryRecipes.map((recipe) => (
          <LibraryRecipeCard key={recipe.title} {...recipe} />
        ))}
      </View>
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
  return (
    <HomeScreenShell
      title="Explorar"
      subtitle="Descubre recetas de otros creadores"
      searchPlaceholder="Buscar recetas o creadores"
    >
      <SectionHeader title="Más recientes" subtitle="Contenido nuevo para empezar" />

      <View style={styles.compactGrid}>
        {exploreSections.recent.map((item) => (
          <RecipePreviewCard key={item.title} title={item.title} creator={item.creator} badge={item.tag} variant="compact" />
        ))}
      </View>

      <SectionHeader title="Más vistos" subtitle="Lo que más está llamando la atención" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {exploreSections.viewed.map((item) => (
          <RecipePreviewCard key={item.title} title={item.title} creator={item.creator} badge={item.tag} variant="featured" />
        ))}
      </ScrollView>

      <SectionHeader title='Recetas por "tag"' subtitle="Ejemplo de cómo se vería la búsqueda por etiquetas" />

      <View style={styles.tagRow}>
        <Chip selected style={styles.tagChip} textStyle={styles.tagChipText}>
          Desayuno
        </Chip>
        <Chip style={styles.tagChip} textStyle={styles.tagChipText}>
          Postre
        </Chip>
        <Chip style={styles.tagChip} textStyle={styles.tagChipText}>
          Cena
        </Chip>
        <Chip style={styles.tagChip} textStyle={styles.tagChipText}>
          Rápido
        </Chip>
      </View>

      <View style={styles.taggedList}>
        {exploreSections.tagged.map((item) => (
          <TaggedRecipeItem key={item.title} {...item} />
        ))}
      </View>
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
    gap: 12,
  },
  horizontalList: {
    gap: 12,
    paddingRight: 4,
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
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});