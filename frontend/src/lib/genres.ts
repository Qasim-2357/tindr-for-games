import type { GameQuery } from "../types";

// Must match IDENTITY_GENRE_COLORS in app/routers/auth.py exactly.
export interface GenreDef {
  key: string; // sent as identity_genre
  color: string; // sent as identity_color
  label: string;
  hex: string;
  vibe: string;
  /** How to ask the backend (RAWG) for this genre. */
  query: Pick<GameQuery, "genres" | "search">;
}

export const GENRES: GenreDef[] = [
  { key: "horror", color: "purple", label: "Horror", hex: "#a855f7", vibe: "Lights off, heart racing.", query: { search: "horror" } }, // RAWG has no "horror" genre, so we search
  { key: "action", color: "red", label: "Action", hex: "#ef4444", vibe: "Fast hands, loud wins.", query: { genres: "action" } },
  { key: "adventure", color: "blue", label: "Adventure", hex: "#3b82f6", vibe: "Always one more horizon.", query: { genres: "adventure" } },
  { key: "rpg", color: "gold", label: "RPG", hex: "#f5b301", vibe: "Become someone else.", query: { genres: "role-playing-games-rpg" } },
  { key: "strategy", color: "green", label: "Strategy", hex: "#22c55e", vibe: "Every move is a plan.", query: { genres: "strategy" } },
  { key: "indie", color: "pink", label: "Indie", hex: "#ec4899", vibe: "Small teams, big hearts.", query: { genres: "indie" } },
];

export const genreByKey = (key: string | null | undefined) =>
  GENRES.find((g) => g.key === key) ?? null;

export const DEFAULT_ACCENT = "#b9a7ff";

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
