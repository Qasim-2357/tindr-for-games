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

export type User = {
  id: number;
  username: string;
  email: string;
  identity_genre: string | null;
  identity_color: string | null;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ProfileUpdateRequest = {
  username?: string | null;
  identity_genre?: string | null;
  identity_color?: string | null;
};

function getApiUrl(): string {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl;
}

async function checkAuthResponse(
  response: Response,
  operation: string,
): Promise<void> {
  if (!response.ok) {
    throw new Error(`${operation} failed with status ${response.status}`);
  }
}

export async function register(payload: RegisterRequest): Promise<User> {
  const response = await fetch(`${getApiUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  await checkAuthResponse(response, "Registration");
  return response.json();
}

export async function login(payload: LoginRequest): Promise<User> {
  const response = await fetch(`${getApiUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  await checkAuthResponse(response, "Login");
  return response.json();
}

export async function logout(): Promise<void> {
  const response = await fetch(`${getApiUrl()}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  await checkAuthResponse(response, "Logout");
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${getApiUrl()}/auth/me`, {
    credentials: "include",
  });

  await checkAuthResponse(response, "Current user request");
  return response.json();
}

export async function updateProfile(
  payload: ProfileUpdateRequest,
): Promise<User> {
  const response = await fetch(`${getApiUrl()}/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  await checkAuthResponse(response, "Profile update");
  return response.json();
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
