import type { Comment, CommentLikeResponse, CommentsResponse, Game, GamesPage, GameQuery, User, WishlistGame, WishlistResponse, WishlistStatus } from "../types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      mode: "cors",
      // The backend stores the JWT in an httpOnly cookie, so cookies must be sent.
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // FastAPI: `detail` is a string, or a list of {msg} for validation errors.
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ")
      : typeof detail === "string"
        ? detail
        : "Something went wrong";
    throw new ApiError(res.status, message);
  }
  return body as T;
}

const qs = (q: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const realApi = {
  register: (username: string, email: string, password: string) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) }),
  login: (email: string, password: string) =>
    request<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),
  updateProfile: (data: { username?: string; identity_genre?: string | null; identity_color?: string | null }) =>
    request<User>("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),

  games: (q: GameQuery = {}) => request<GamesPage>(`/games${qs({ ...q })}`),
  search: (query: string, page = 1, page_size = 20) =>
    request<GamesPage>(`/games/search${qs({ q: query, page, page_size })}`),
  trending: (page = 1, page_size = 20) => request<GamesPage>(`/games/trending${qs({ page, page_size })}`),
  popular: (page = 1, page_size = 20) => request<GamesPage>(`/games/popular${qs({ page, page_size })}`),
  newReleases: (page = 1, page_size = 20) => request<GamesPage>(`/games/new-releases${qs({ page, page_size })}`),
  gameBySlug: (slug: string) => request<Game>(`/games/by-slug/${encodeURIComponent(slug)}`),
  wishlistStatus: (gameId: number) => request<WishlistStatus>(`/games/${gameId}/wishlist`),
  addToWishlist: (gameId: number) =>
    request<WishlistResponse>(`/games/${gameId}/wishlist`, { method: "POST" }),
  removeFromWishlist: (gameId: number) =>
    request<void>(`/games/${gameId}/wishlist`, { method: "DELETE" }),
  wishlist: () => request<WishlistGame[]>("/wishlist"),
  comments: (gameId: number, page = 1, pageSize = 20) =>
    request<CommentsResponse>(`/games/${gameId}/comments${qs({ page, page_size: pageSize })}`),
  createComment: (gameId: number, content: string) =>
    request<Comment>(`/games/${gameId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  createReply: (commentId: number, content: string) =>
    request<Comment>(`/comments/${commentId}/replies`, { method: "POST", body: JSON.stringify({ content }) }),
  updateComment: (commentId: number, content: string) =>
    request<Comment>(`/comments/${commentId}`, { method: "PATCH", body: JSON.stringify({ content }) }),
  deleteComment: (commentId: number) =>
    request<void>(`/comments/${commentId}`, { method: "DELETE" }),
  likeComment: (commentId: number) =>
    request<CommentLikeResponse>(`/comments/${commentId}/like`, { method: "POST" }),
  unlikeComment: (commentId: number) =>
    request<CommentLikeResponse>(`/comments/${commentId}/like`, { method: "DELETE" }),
};

export type Api = typeof realApi;
