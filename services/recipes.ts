const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// If the server returns a relative path (e.g. "/media/..."), prepend the backend URL.
// Already-absolute URLs pass through unchanged.
const resolveImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_URL}${url}`;
};

export type SearchRecipeItem = {
  id: string;
  name: string;
  origin: string;
  tags: string[];
  thumbnailUrl?: string | null;
};

type SearchRawItem = {
  id: string;
  name: string;
  origin?: string;
  tags?: string[];
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
};

export type SearchResponse = {
  meta: { sessionId: string; totalItems: number };
  recipes: SearchRecipeItem[];
};

export const searchRecipes = async (
  query: string,
  page: number,
  limit: number,
  searchId?: string | null,
): Promise<SearchResponse> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');

  const params = new URLSearchParams({ query, page: String(page), limit: String(limit) });
  if (searchId) params.append('search_id', searchId);

  const response = await fetch(`${BACKEND_URL}/recipes/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Search failed (${response.status})`);

  const data = (await response.json()) as {
    meta: { sessionId: string; totalItems: number };
    recipes: SearchRawItem[];
  };

  return {
    meta: data.meta,
    recipes: data.recipes.map(item => ({
      id: item.id,
      name: item.name,
      origin: item.origin ?? 'external',
      tags: item.tags ?? [],
      thumbnailUrl: resolveImageUrl(item.thumbnailUrl ?? item.thumbnail_url),
    })),
  };
};

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

export type RecipeDetail = {
  id: string;
  name: string;
  origin: string;
  tags: string[];
  description: string;
  instructions: string;
  ingredients: Array<{ name: string; amount: string }>;
  thumbnailUrl?: string;
  videoUrl?: string;
};

type LatestRecipesResponse = {
  recipes?: LatestRecipeApiItem[];
};

type RecipeDetailApiResponse = {
  id: string;
  name: string;
  origin?: string;
  tags?: string[];
  description?: string | null;
  instructions?: string;
  ingredients?: Record<string, string>;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  videoUrl?: string;
  video_url?: string;
};

const normalizeLatestRecipe = (recipe: LatestRecipeApiItem): LatestRecipeCardData => ({
  id: recipe.id,
  title: recipe.name,
  creator: recipe.origin ? recipe.origin : 'external',
  badge: recipe.tags?.[0] ?? 'Reciente',
  thumbnailUrl: resolveImageUrl(recipe.thumbnailUrl ?? recipe.thumbnail_url),
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

  return recipes.slice(0, limit).map(normalizeLatestRecipe);
};

export const getRecipeHistory = async (limit = 10, offset = 0): Promise<LatestRecipeCardData[]> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  const response = await fetch(`${BACKEND_URL}/recipes/history?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error(`Failed to fetch history (${response.status})`);
  const data = (await response.json()) as { recipes?: LatestRecipeApiItem[] } | LatestRecipeApiItem[];
  const recipes = Array.isArray(data) ? data : data.recipes ?? [];
  return recipes.map(normalizeLatestRecipe);
};

export const getPopularRecipes = async (limit = 10): Promise<LatestRecipeCardData[]> => {
  if (!BACKEND_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  }

  const response = await fetch(`${BACKEND_URL}/recipes/popular?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch popular recipes (${response.status})`);
  }

  const data = (await response.json()) as LatestRecipesResponse | LatestRecipeApiItem[];

  const recipes = Array.isArray(data) ? data : data.recipes ?? [];

  return recipes.slice(0, limit).map(normalizeLatestRecipe);
};

export type TopTagsRecipeItem = {
  id: string;
  name: string;
  origin: string;
  tags: string[];
  thumbnailUrl?: string | null;
};

type TopTagsRawItem = {
  id: string;
  name: string;
  origin?: string;
  tags?: string[];
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
};

const normalizeTopTagsItem = (item: TopTagsRawItem): TopTagsRecipeItem => ({
  id: item.id,
  name: item.name,
  origin: item.origin ?? 'external',
  tags: item.tags ?? [],
  thumbnailUrl: resolveImageUrl(item.thumbnailUrl ?? item.thumbnail_url),
});

export const getTopTags = async (tagsLimit = 6, recipesLimit = 4): Promise<Record<string, TopTagsRecipeItem[]>> => {
  if (!BACKEND_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  }

  const response = await fetch(`${BACKEND_URL}/recipes/top-tags?tags_limit=${tagsLimit}&recipes_limit=${recipesLimit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch top tags (${response.status})`);
  }

  const data = (await response.json()) as { recipes: Array<Record<string, TopTagsRawItem[]>> };
  const result: Record<string, TopTagsRecipeItem[]> = {};

  for (const tagObject of data.recipes) {
    const tagName = Object.keys(tagObject)[0];
    if (tagName) {
      result[tagName] = tagObject[tagName].map(normalizeTopTagsItem);
    }
  }

  return result;
};

type GroupRecipeRawItem = {
  id: string;
  name: string;
  origin?: string;
  tags?: string[];
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
};

export type GroupRecipeItem = {
  id: string;
  name: string;
  origin: string;
  tags: string[];
  thumbnailUrl?: string | null;
};

export type RecipeGroup = {
  groupId: string;
  groupName: string;
  recipes: GroupRecipeItem[];
};

const normalizeGroupRecipeItem = (item: GroupRecipeRawItem): GroupRecipeItem => ({
  id: item.id,
  name: item.name,
  origin: item.origin ?? 'external',
  tags: item.tags ?? [],
  thumbnailUrl: resolveImageUrl(item.thumbnailUrl ?? item.thumbnail_url),
});

export const getTagsAutocomplete = async (query: string, limit = 6): Promise<string[]> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  if (!query.trim()) return [];
  const response = await fetch(`${BACKEND_URL}/tags/autocomplete?query=${encodeURIComponent(query.trim())}&limit=${limit}`);
  if (!response.ok) return [];
  return (await response.json()) as string[];
};

export type CreateRecipePayload = {
  name: string;
  instructions: string;
  description?: string | null;
  ingredients?: Record<string, string>;
  tags?: string[];
  imageUri?: string | null;
};

export const createRecipe = async (payload: CreateRecipePayload): Promise<{ id: string }> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');

  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('instructions', payload.instructions);
  if (payload.description) formData.append('description', payload.description);

  // ingredients: Blob with application/json type (equivalent to curl's ;type=application/json)
  if (payload.ingredients && Object.keys(payload.ingredients).length > 0) {
    const blob = new Blob([JSON.stringify(payload.ingredients)], { type: 'application/json' });
    formData.append('ingredients', blob);
  }

  // tags: JSON array string as required by the API
  if (payload.tags && payload.tags.length > 0) {
    formData.append('tags', JSON.stringify(payload.tags));
  }

  // image: fetch the local URI as a Blob (React Native supports file:// in fetch)
  if (payload.imageUri) {
    const uri = payload.imageUri;
    const filename = uri.split('/').pop() ?? 'recipe.jpg';
    try {
      const imageResponse = await fetch(uri);
      const imageBlob = await imageResponse.blob();
      formData.append('image', imageBlob, filename);
    } catch (e) {
      console.warn('[createRecipe] image read failed, skipping:', e);
    }
  }

  const response = await fetch(`${BACKEND_URL}/recipes`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch { /* ignore */ }
    throw new Error(`Failed to create recipe (${response.status}): ${detail}`);
  }
  return (await response.json()) as { id: string };
};

export const addRecipeToGroup = async (groupId: string, recipeId: string): Promise<void> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  const response = await fetch(`${BACKEND_URL}/groups/${groupId}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_id: recipeId }),
  });
  if (!response.ok) throw new Error(`Failed to add recipe to group (${response.status})`);
};

export const createGroup = async (name: string, description?: string | null): Promise<{ id: string }> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');

  const body: Record<string, string> = { name };
  if (description) body.description = description;

  const response = await fetch(`${BACKEND_URL}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Failed to create group (${response.status})`);
  return (await response.json()) as { id: string };
};

export const getGroups = async (groupsLimit = 20, recipesLimit = 4): Promise<RecipeGroup[]> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');

  const response = await fetch(`${BACKEND_URL}/groups?groups_limit=${groupsLimit}&recipes_limit=${recipesLimit}`);
  if (!response.ok) throw new Error(`Failed to fetch groups (${response.status})`);

  const data = (await response.json()) as {
    groups: Array<{ group_id: string; group_name: string; recipes: GroupRecipeRawItem[] }>;
  };

  return (data.groups ?? []).map(g => ({
    groupId: g.group_id,
    groupName: g.group_name,
    recipes: (g.recipes ?? []).map(normalizeGroupRecipeItem),
  }));
};

export const getGroupRecipes = async (groupId: string, recipesLimit = 8, offset = 0): Promise<GroupRecipeItem[]> => {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');

  const response = await fetch(`${BACKEND_URL}/groups/${groupId}/recipes?recipes_limit=${recipesLimit}&offset=${offset}`);
  if (!response.ok) throw new Error(`Failed to fetch group recipes (${response.status})`);

  const data = (await response.json()) as { recipes: GroupRecipeRawItem[] };
  return (data.recipes ?? []).map(normalizeGroupRecipeItem);
};

export const getRecipeById = async (id: string): Promise<RecipeDetail> => {
  if (!BACKEND_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured');
  }

  const response = await fetch(`${BACKEND_URL}/recipes/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch recipe detail (${response.status})`);
  }

  const data = (await response.json()) as RecipeDetailApiResponse;
  const ingredientEntries = Object.entries(data.ingredients ?? {});

  return {
    id: data.id,
    name: data.name,
    origin: data.origin ?? 'external',
    tags: data.tags ?? [],
    description: data.description ?? '',
    instructions: data.instructions ?? '',
    ingredients: ingredientEntries.map(([name, amount]) => ({ name, amount })),
    thumbnailUrl: resolveImageUrl(data.thumbnailUrl ?? data.thumbnail_url),
    videoUrl: data.videoUrl ?? data.video_url,
  };
};