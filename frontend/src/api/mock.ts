// Fake backend used ONLY by the visual preview (VITE_MOCK=true). Same shape as the real client.
import type { Api } from "./client";
import { ApiError } from "./client";
import type { Comment, CommentLikeResponse, CommentsResponse, Game, GamesPage, User } from "../types";

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));

const A = ["Nightfall", "Ember", "Hollow", "Neon", "Iron", "Silent", "Crimson", "Lunar", "Shattered", "Velvet", "Feral", "Astral", "Gilded", "Rust", "Echo", "Wander"];
const B = ["Protocol", "Chronicles", "Gardens", "Vanguard", "Descent", "Kingdoms", "Harbor", "Circuit", "Oath", "Frontier", "Lullaby", "Tactics", "Odyssey", "Depths", "Reverie", "Signal"];
const GENRE_KEYS = ["horror", "action", "adventure", "rpg", "strategy", "indie"];
const DESC =
  "A hand-built world where every choice leaves a mark. Explore forgotten places, meet strange companions, and shape a story that is different every time you play. This is placeholder text used only in the visual preview.";

let s = 7;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

const GAMES: (Game & { _g: string })[] = Array.from({ length: 72 }, (_, i) => {
  const name = `${A[i % A.length]} ${B[(i * 5 + 3) % B.length]}`;
  const year = 2022 + Math.floor(rnd() * 5);
  const full = i >= 16 ? `${name} ${["II", "Zero", "Reborn", "Origins"][i % 4]}` : name;
  return {
    id: i + 1,
    external_id: String(1000 + i),
    external_provider: "rawg",
    name: full,
    slug: full.toLowerCase().replace(/\s+/g, "-"),
    description: DESC,
    release_date: `${year}-${String(1 + Math.floor(rnd() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rnd() * 27)).padStart(2, "0")}`,
    rating: Math.round((3.2 + rnd() * 1.7) * 100) / 100,
    rating_count: Math.floor(500 + rnd() * 9000),
    metacritic: rnd() > 0.25 ? Math.floor(62 + rnd() * 34) : null,
    cover_image: null,
    background_image: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _g: GENRE_KEYS[i % GENRE_KEYS.length],
  };
});

const GENRE_SLUG: Record<string, string> = { "role-playing-games-rpg": "rpg" };

function page(list: Game[], p: number, size: number): GamesPage {
  return { items: list.slice((p - 1) * size, p * size), page: p, page_size: size, total: list.length };
}
const strip = (g: (typeof GAMES)[number]): Game => {
  const { _g, ...rest } = g;
  void _g;
  return rest;
};

let user: User | null = null;
const accounts = new Map<string, { user: User; password: string }>();
let nextCommentId = 1;
const commentsByGame = new Map<number, Comment[]>();

const commentResponse = (items: Comment[], pageNumber: number, pageSize: number): CommentsResponse => ({
  items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
  page: pageNumber,
  page_size: pageSize,
  total: items.length,
});

export const mockApi: Api = {
  async register(username, email, password) {
    await wait();
    if (accounts.has(email.toLowerCase())) throw new ApiError(409, "Username or email already exists");
    const u: User = { id: accounts.size + 1, username, email: email.toLowerCase(), identity_genre: null, identity_color: null };
    accounts.set(u.email, { user: u, password });
    return u;
  },
  async login(email) {
    await wait();
    const found = accounts.get(email.toLowerCase());
    // Preview convenience: any email signs you in.
    user = found?.user ?? { id: 99, username: email.split("@")[0] || "player", email, identity_genre: null, identity_color: null };
    return user;
  },
  async logout() { await wait(150); user = null; },
  async me() {
    await wait(300);
    if (!user) throw new ApiError(401, "Could not validate credentials");
    return user;
  },
  async updateProfile(data) {
    await wait(350);
    if (!user) throw new ApiError(401, "Could not validate credentials");
    user = {
      ...user,
      ...(data.username ? { username: data.username } : {}),
      ...("identity_genre" in data ? { identity_genre: data.identity_genre ?? null, identity_color: data.identity_color ?? null } : {}),
    };
    return user;
  },

  async games(q = {}) {
    await wait();
    let list = GAMES.filter((g) => {
      if (q.genres) return g._g === (GENRE_SLUG[q.genres] ?? q.genres);
      if (q.search) return g._g === q.search.toLowerCase() || g.name.toLowerCase().includes(q.search.toLowerCase());
      return true;
    });
    if (q.ordering === "-rating") list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return page(list.map(strip), q.page ?? 1, q.page_size ?? 20);
  },
  async search(query, p = 1, size = 20) {
    await wait(300);
    return page(GAMES.filter((g) => g.name.toLowerCase().includes(query.toLowerCase())).map(strip), p, size);
  },
  async trending(p = 1, size = 20) { await wait(); return page(GAMES.map(strip), p, size); },
  async popular(p = 1, size = 20) { await wait(); return page([...GAMES].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).map(strip), p, size); },
  async newReleases(p = 1, size = 20) { await wait(); return page([...GAMES].sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? "")).map(strip), p, size); },
  async gameBySlug(slug) {
    await wait(300);
    const g = GAMES.find((x) => x.slug === slug);
    if (!g) throw new ApiError(404, "Game not found");
    return strip(g);
  },
  async wishlistStatus() { await wait(150); return { wishlisted: false }; },
  async addToWishlist(gameId) {
    await wait(200);
    return { game_id: gameId, wishlisted: true, created_at: new Date().toISOString() };
  },
  async removeFromWishlist() { await wait(150); },
  async wishlist() { await wait(250); return []; },
  async comments(gameId, pageNumber = 1, pageSize = 20) {
    await wait(250);
    return commentResponse(commentsByGame.get(gameId) ?? [], pageNumber, pageSize);
  },
  async createComment(gameId, content) {
    await wait(250);
    if (!user) throw new ApiError(401, "Could not validate credentials");
    const comment: Comment = {
      id: nextCommentId++,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: user.id, username: user.username, identity_genre: user.identity_genre, identity_color: user.identity_color },
      like_count: 0,
      liked_by_me: false,
      replies: [],
    };
    commentsByGame.set(gameId, [...(commentsByGame.get(gameId) ?? []), comment]);
    return comment;
  },
  async createReply(commentId, content) {
    await wait(250);
    if (!user) throw new ApiError(401, "Could not validate credentials");
    for (const comments of commentsByGame.values()) {
      const parent = comments.find((comment) => comment.id === commentId);
      if (parent) {
        const reply: Comment = {
          id: nextCommentId++,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: { id: user.id, username: user.username, identity_genre: user.identity_genre, identity_color: user.identity_color },
          like_count: 0,
          liked_by_me: false,
          replies: [],
        };
        parent.replies.push(reply);
        return reply;
      }
    }
    throw new ApiError(404, "Comment not found");
  },
  async updateComment(commentId, content) {
    await wait(200);
    if (!user) throw new ApiError(401, "Could not validate credentials");
    for (const comments of commentsByGame.values()) {
      const comment = comments.flatMap((item) => [item, ...item.replies]).find((item) => item.id === commentId);
      if (comment) {
        if (comment.user.id !== user.id) throw new ApiError(403, "You can only edit your own comments");
        comment.content = content;
        comment.updated_at = new Date().toISOString();
        return comment;
      }
    }
    throw new ApiError(404, "Comment not found");
  },
  async deleteComment(commentId) {
    await wait(200);
    if (!user) throw new ApiError(401, "Could not validate credentials");
    await this.updateComment(commentId, "This comment was deleted.");
  },
  async likeComment(commentId): Promise<CommentLikeResponse> {
    await wait(150);
    if (!user) throw new ApiError(401, "Could not validate credentials");
    const comment = [...commentsByGame.values()].flatMap((items) => items.flatMap((item) => [item, ...item.replies])).find((item) => item.id === commentId);
    if (!comment) throw new ApiError(404, "Comment not found");
    if (comment.liked_by_me) throw new ApiError(409, "Comment already liked");
    comment.liked_by_me = true;
    comment.like_count += 1;
    return { liked: true, like_count: comment.like_count };
  },
  async unlikeComment(commentId): Promise<CommentLikeResponse> {
    await wait(150);
    if (!user) throw new ApiError(401, "Could not validate credentials");
    const comment = [...commentsByGame.values()].flatMap((items) => items.flatMap((item) => [item, ...item.replies])).find((item) => item.id === commentId);
    if (!comment) throw new ApiError(404, "Comment not found");
    if (!comment.liked_by_me) throw new ApiError(404, "Like not found");
    comment.liked_by_me = false;
    comment.like_count = Math.max(0, comment.like_count - 1);
    return { liked: false, like_count: comment.like_count };
  },
};
