import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { GENRES, genreByKey } from "../lib/genres";

interface ThemeState {
  /** Genre colour used by the background lights (null = default colour). */
  focus: string | null;
  /** Temporarily preview another genre colour (used while picking). */
  setPreview: (hex: string | null) => void;
}

const ThemeCtx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const identityColor = GENRES.find((genre) => genre.color === user?.identity_color)?.hex;
  const focus = preview ?? identityColor ?? genreByKey(user?.identity_genre)?.hex ?? null;
  const value = useMemo(() => ({ focus, setPreview }), [focus]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
