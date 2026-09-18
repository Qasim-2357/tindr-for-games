const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type Game = {
  id: number;
  external_id: string;
  external_provider: string;
  name: string;
  slug: string;
  description: string | null;
  release_date: string | null;
  rating: number | null;
  rating_count: number | null;
  metacritic: number | null;
  cover_image: string | null;
  background_image: string | null;
  created_at: string;
  updated_at: string;
};

export type GamesResponse = {
  items: Game[];
  page: number;
  page_size: number;
  total: number;
};

function getApiUrl(): string {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl;
}

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(`${getApiUrl()}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

export async function getTrendingGames(): Promise<GamesResponse> {
  const response = await fetch(`${getApiUrl()}/games/trending`);

  if (!response.ok) {
    throw new Error(`Trending games request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getPopularGames(): Promise<GamesResponse> {
  const response = await fetch(`${getApiUrl()}/games/popular`);

  if (!response.ok) {
    throw new Error(`Popular games request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getNewReleases(): Promise<GamesResponse> {
  const response = await fetch(`${getApiUrl()}/games/new-releases`);

  if (!response.ok) {
    throw new Error(`New releases request failed with status ${response.status}`);
  }

  return response.json();
}

export async function searchGames(query: string): Promise<GamesResponse> {
  const response = await fetch(
    `${getApiUrl()}/games/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error(`Game search failed with status ${response.status}`);
  }

  return response.json();
}

export async function getGames(filters: {
  genres?: string;
  platforms?: string;
}): Promise<GamesResponse> {
  const params = new URLSearchParams();

  if (filters.genres) {
    params.set("genres", filters.genres);
  }
  if (filters.platforms) {
    params.set("platforms", filters.platforms);
  }

  const query = params.toString();
  const response = await fetch(`${getApiUrl()}/games${query ? `?${query}` : ""}`);

  if (!response.ok) {
    throw new Error(`Filtered games request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const response = await fetch(
    `${getApiUrl()}/games/by-slug/${encodeURIComponent(slug)}`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Game request failed with status ${response.status}`);
  }

  return response.json();
}
