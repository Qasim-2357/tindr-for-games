import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronDown, RefreshCw, Search, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import { genreByKey } from "../lib/genres";
import { piece, stagger } from "../lib/motion";
import type { Game } from "../types";
import GameCard, { GameCardSkeleton } from "../components/GameCard";
import GlassButton from "../components/GlassButton";
import GlassCard from "../components/GlassCard";
import Reveal from "../components/Reveal";

type Tab = "foryou" | "trending" | "popular" | "new";
const PAGE_SIZE = 20;
const genreOptions = [
  { value: "", label: "All genres" },
  { value: "action", label: "Action" },
  { value: "adventure", label: "Adventure" },
  { value: "indie", label: "Indie" },
  { value: "role-playing-games-rpg", label: "RPG" },
  { value: "strategy", label: "Strategy" },
];
const platformOptions = [
  { value: "", label: "All platforms" },
  { value: "4", label: "PC" },
  { value: "18", label: "PlayStation 4" },
  { value: "187", label: "PlayStation 5" },
  { value: "1", label: "Xbox One" },
  { value: "186", label: "Xbox Series S/X" },
  { value: "7", label: "Nintendo Switch" },
];

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-40 flex-1">
      <span className="sr-only" id={`${label}-filter-label`}>{label}</span>
      <button
        type="button"
        className="input-glass flex !h-11 w-full items-center justify-between !rounded-xl text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${label}-filter-label`}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected.label}</span>
        <ChevronDown className={`h-4 w-4 text-white/55 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="glass absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl p-1.5"
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                option.value === value ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const genre = genreByKey(user?.identity_genre);

  const tabs: { id: Tab; label: string }[] = [
    ...(genre ? [{ id: "foryou" as Tab, label: `${genre.label} for you` }] : []),
    { id: "trending", label: "Trending" },
    { id: "popular", label: "Top rated" },
    { id: "new", label: "New releases" },
  ];

  const [tab, setTab] = useState<Tab>(genre ? "foryou" : "trending");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [items, setItems] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  const fetchPage = useCallback((p: number) => {
    if (aiMode) {
      if (!aiQuery) {
        return Promise.resolve({ items: [], page: p, page_size: PAGE_SIZE, total: 0 });
      }
      const aiRecommendations = api.aiRecommendations;
      if (!aiRecommendations) {
        return Promise.reject(new ApiError(0, "AI recommendations are unavailable."));
      }
      return aiRecommendations(aiQuery, p, PAGE_SIZE).then((recommendations) => ({
        ...recommendations,
        items: recommendations.items.map((game) => ({
          id: game.id,
          external_id: String(game.id),
          external_provider: "ai",
          name: game.name,
          slug: game.slug,
          description: null,
          release_date: game.release_date,
          rating: game.rating,
          rating_count: null,
          metacritic: null,
          cover_image: game.cover_image,
          background_image: null,
          screenshots: null,
          created_at: "",
          updated_at: "",
        })),
      }));
    }
    if (query || filterGenre || filterPlatform) {
      return api.games({
        search: query || undefined,
        genres: filterGenre || undefined,
        platforms: filterPlatform || undefined,
        page: p,
        page_size: PAGE_SIZE,
      });
    }
    if (tab === "foryou") {
      return api.recommendations(p, PAGE_SIZE).then((recommendations) => ({
        ...recommendations,
        items: recommendations.items.map((game) => ({
          id: game.id,
          external_id: String(game.id),
          external_provider: "recommendations",
          name: game.name,
          slug: game.slug,
          description: null,
          release_date: game.release_date,
          rating: game.rating,
          rating_count: null,
          metacritic: null,
          cover_image: game.cover_image,
          background_image: null,
          screenshots: null,
          created_at: "",
          updated_at: "",
        })),
      }));
    }
    if (tab === "popular") return api.popular(p, PAGE_SIZE);
    if (tab === "new") return api.newReleases(p, PAGE_SIZE);
    return api.trending(p, PAGE_SIZE);
  }, [aiMode, aiQuery, query, tab, genre, filterGenre, filterPlatform]);

  const load = useCallback(async (p: number) => {
    const id = ++reqId.current;
    setLoading(true); setError(null);
    try {
      const res = await fetchPage(p);
      if (id !== reqId.current) return; // a newer request superseded this one
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setTotal(res.total); setPage(p);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof ApiError ? e.message : "Couldn't load games.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    reqId.current += 1;
    setItems([]);
    if (aiMode && !aiQuery) {
      setTotal(0);
      setLoading(false);
      setError(null);
      return;
    }
    load(1);
  }, [aiMode, aiQuery, load]);

  const searching = query.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      {/* Top pieces: welcome, search, tabs */}
      <motion.div variants={stagger(0.12, 0.05)} initial="hidden" animate="show" className="flex flex-col gap-4">
        <GlassCard variants={piece} className="p-6 sm:p-8">
          <h1 className="font-display text-3xl font-medium sm:text-5xl">
            <Reveal text={`Welcome back, ${user?.username ?? ""}.`} delay={0.2} />
          </h1>
          <p className="mt-3 text-white/60">
            {genre ? `Your ${genre.label.toLowerCase()} picks are ready.` : "Here's what people are playing right now."}
          </p>
        </GlassCard>

        <div className="flex flex-col gap-4 lg:flex-row">
          <GlassCard variants={piece} className="relative flex-1 rounded-2xl">
            {aiMode ? (
              <form
                className="flex h-14 items-center gap-3 px-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const trimmed = aiInput.trim();
                  if (!trimmed) return;
                  setAiQuery(trimmed);
                }}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-white/60" />
                <input
                  className="ai-input min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Describe what you want to play..."
                  value={aiInput}
                  maxLength={1000}
                  onChange={(e) => setAiInput(e.target.value)}
                  aria-label="Describe what you want to play"
                />
                <GlassButton type="submit" className="!h-9 !px-3 text-sm">Find games</GlassButton>
              </form>
            ) : (
              <>
                <Search className="pointer-events-none absolute left-5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  className="h-14 w-full rounded-2xl bg-transparent pl-12 pr-24 text-base text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Search for a game"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  aria-label="Search games"
                />
                <button
                  type="button"
                  className="btn-glass absolute right-2 top-1/2 !h-10 -translate-y-1/2 !rounded-xl !px-3 text-sm"
                  onClick={() => {
                    setAiMode(true);
                    setInput("");
                    setQuery("");
                    setAiInput("");
                    setAiQuery("");
                  }}
                  aria-label="Ask AI for game recommendations"
                >
                  <Sparkles className="h-4 w-4" /> Ask AI
                </button>
              </>
            )}
          </GlassCard>

          {aiMode ? (
            <GlassButton
              variants={piece}
              onClick={() => {
                setAiMode(false);
                setAiInput("");
                setAiQuery("");
                setItems([]);
              }}
              className="self-start"
            >
              <X className="h-4 w-4" /> Normal search
            </GlassButton>
          ) : !searching && (
            <GlassCard variants={piece} className="inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-2xl p-1.5">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className="relative shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ color: tab === t.id ? "#fff" : "rgb(255 255 255 / 0.55)" }}>
                  {tab === t.id && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-xl border border-white/12 bg-white/10"
                      style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.2)" }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </GlassCard>
          )}
        </div>
      </motion.div>

      {!aiMode && <div className="glass-control mt-5 flex flex-wrap items-end gap-3 rounded-2xl p-3">
        <div className="flex items-center gap-2 pr-1 text-sm text-white/60">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <FilterDropdown
          label="Genre"
          value={filterGenre}
          options={genreOptions}
          onChange={(value) => { setFilterGenre(value); setTab("trending"); }}
        />
        <FilterDropdown
          label="Platform"
          value={filterPlatform}
          options={platformOptions}
          onChange={(value) => { setFilterPlatform(value); setTab("trending"); }}
        />
        {(filterGenre || filterPlatform) && (
          <button
            type="button"
            className="btn-glass !h-11 !px-4"
            onClick={() => { setFilterGenre(""); setFilterPlatform(""); }}
          >
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>}

      <p aria-live="polite" className={`text-sm text-white/55 ${aiQuery || searching || filterGenre || filterPlatform ? "mt-6" : "sr-only"}`}>
        {aiQuery ? `AI results for “${aiQuery}”` : searching ? `Results for “${query}”` : filterGenre || filterPlatform ? "Filtered games" : ""}
      </p>

      {/* Games: each is a picture piece + an info piece */}
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {items.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
        {loading && Array.from({ length: items.length ? 4 : 8 }, (_, i) => <GameCardSkeleton key={`s${i}`} />)}
      </div>

      {error && (
        <GlassCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-8 flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="h-6 w-6 text-white/70" />
          <p className="text-white/80">{error}</p>
          <GlassButton onClick={() => load(items.length ? page + 1 : 1)}><RefreshCw className="h-4 w-4" /> Try again</GlassButton>
        </GlassCard>
      )}

      {aiMode && !aiQuery && (
        <GlassCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 p-8 text-center">
          <Sparkles className="h-6 w-6 text-white/60" />
          <p className="text-white/80">Describe what you want to play</p>
          <p className="text-sm text-white/45">Tell us the mood, genre, or kind of world you are looking for.</p>
        </GlassCard>
      )}

      {!aiMode && !loading && !error && items.length === 0 && (
        <GlassCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 p-8 text-center">
          <SearchX className="h-6 w-6 text-white/60" />
          <p className="text-white/80">No games found. Try another search or tab.</p>
        </GlassCard>
      )}

      {!loading && !error && items.length > 0 && items.length < total && (
        <div className="mt-10 flex justify-center">
          <GlassButton onClick={() => load(page + 1)}>Show more games</GlassButton>
        </div>
      )}
    </div>
  );
}
