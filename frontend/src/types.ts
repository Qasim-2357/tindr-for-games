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
  screenshots?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface GamesPage {
  items: Game[];
  page: number;
  page_size: number;
  total: number;
}

export interface RecommendationGame {
  id: number;
  name: string;
  slug: string;
  cover_image: string | null;
  rating: number | null;
  release_date: string | null;
}

export interface RecommendationsPage {
  items: RecommendationGame[];
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

export interface WishlistStatus {
  wishlisted: boolean;
}

export interface WishlistResponse {
  game_id: number;
  wishlisted: boolean;
  created_at: string;
}

export interface WishlistGame {
  game_id: number;
  name: string;
  slug: string;
  cover_image: string | null;
  release_date: string | null;
  rating: number | null;
  created_at: string;
}

export interface CommentUser {
  id: number;
  username: string;
  identity_genre: string | null;
  identity_color: string | null;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: CommentUser;
  like_count: number;
  liked_by_me: boolean;
  replies: Comment[];
}

export interface CommentsResponse {
  items: Comment[];
  page: number;
  page_size: number;
  total: number;
}

export interface CommentLikeResponse {
  liked: boolean;
  like_count: number;
}
