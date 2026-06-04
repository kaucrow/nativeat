const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type LatestRecipeApiItem = {
  id: string;
  name: string;
  origin?: string;
  tags?: string[];
  thumbnailUrl?: string;
  thumbnail_url?: string;
};

export type LatestRecipeCardData = {
  id: string;
  title: string;
  creator: string;
  badge: string;
  thumbnailUrl?: string;
};

type LatestRecipesResponse = {
  recipes?: LatestRecipeApiItem[];
};

const normalizeLatestRecipe = (recipe: LatestRecipeApiItem): LatestRecipeCardData => ({
  id: recipe.id,
  title: recipe.name,
  creator: recipe.origin ? recipe.origin : 'external',
  badge: recipe.tags?.[0] ?? 'Reciente',
  thumbnailUrl: recipe.thumbnailUrl ?? recipe.thumbnail_url,
});

export const getLatestRecipes = async (limit = 10): Promise<LatestRecipeCardData[]> => {
  if (!BACKEND_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  }

  const response = await fetch(`${BACKEND_URL}/recipes/latest?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch latest recipes (${response.status})`);
  }

  const data = (await response.json()) as LatestRecipesResponse | LatestRecipeApiItem[];

  const recipes = Array.isArray(data) ? data : data.recipes ?? [];

  return recipes.map(normalizeLatestRecipe);
};