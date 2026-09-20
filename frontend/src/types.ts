// Mirrors the Pydantic schemas in the FastAPI backend.
export interface User {
  id: number;
  username: string;
  email: string;
  identity_genre: string | null;
  identity_color: string | null;
}

export interface Game {
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
}

export interface GamesPage {
  items: Game[];
  page: number;
  page_size: number;
  total: number;
}

export interface GameQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  genres?: string;
  platforms?: string;
  dates?: string;
}
