import { useEffect, useState } from "react";
import { ArrowRight, Check, Heart, RefreshCw, Star, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import { genreByKey } from "../lib/genres";
import type { DailyGame } from "../types";
import GameCover from "../components/GameCover";
import GlassButton from "../components/GlassButton";
import GlassCard from "../components/GlassCard";

export default function DailyGamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [games, setGames] = useState<DailyGame[]>([]);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    setIndex(0);
    api.daily(1, 10)
      .then((response) => {
        setGames(response.items);
        setTotal(response.total);
      })
      .catch((reason) => setError(reason instanceof ApiError ? reason.message : "Couldn't load the daily games."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const advance = (clearNotice = true) => {
    if (clearNotice) setNotice(null);
    setIndex((current) => current + 1);
  };

  const wishlist = async () => {
    if (!game || wishlistBusy) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    setWishlistBusy(true);
    try {
      await api.addToWishlist(game.id);
      advance(false);
      setNotice("Added to your wishlist");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Couldn't update your wishlist.");
    } finally {
      setWishlistBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <GlassCard className="mx-auto max-w-xl p-3">
          <div className="skeleton aspect-[4/3] !rounded-[1rem]" />
          <div className="space-y-3 p-5"><div className="skeleton h-7 w-2/3" /><div className="skeleton h-4 w-1/3" /><div className="skeleton h-16 w-full" /></div>
        </GlassCard>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <p className="text-white/75">{error}</p>
          <GlassButton onClick={load}><RefreshCw className="h-4 w-4" /> Retry</GlassButton>
        </GlassCard>
      </main>
    );
  }

  if (games.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <h1 className="font-display text-2xl font-medium">Your daily deck is quiet</h1>
          <p className="text-sm leading-6 text-white/55">There are no new games to show right now. Explore the full library instead.</p>
          <Link to="/discover" className="btn-primary no-underline">Discover games <ArrowRight className="h-4 w-4" /></Link>
        </GlassCard>
      </main>
    );
  }

  const finished = index >= games.length;
  if (finished) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-xl">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="auth-kicker">A fresh pick every day</p>
              <h1 className="font-display text-3xl font-medium sm:text-5xl">Daily Game</h1>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-white/45">Complete</span>
          </div>
          <GlassCard className="flex flex-col items-center gap-4 p-10 text-center">
            <Check className="h-7 w-7 text-white/70" />
            <h2 className="font-display text-2xl font-medium">You've explored today's games</h2>
            <p className="max-w-sm text-sm leading-6 text-white/55">Come back tomorrow for a fresh order, or keep discovering worlds from the full library.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <GlassButton variant="primary" onClick={() => { setIndex(0); setNotice(null); }}>Play again</GlassButton>
              <Link to="/discover" className="btn-glass no-underline">Explore Discover <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  const game = games[index];
  const releaseYear = game.release_date?.slice(0, 4) ?? "TBA";
  const progress = Math.min(index + 1, total);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-xl">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="auth-kicker">A fresh pick every day</p>
            <h1 className="font-display text-3xl font-medium sm:text-5xl">Daily Game</h1>
          </div>
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Game {String(progress).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>

        <div className="relative">
            <div className="absolute inset-x-5 top-4 h-full rounded-[1.25rem] border border-white/8 bg-white/[0.025]" />
            <div className="absolute inset-x-2 top-2 h-full rounded-[1.25rem] border border-white/8 bg-white/[0.04]" />
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: reducedMotion ? 0 : -40 }}
              transition={{ duration: reducedMotion ? 0 : 0.4 }}
              className="relative"
            >
              <GlassCard className="overflow-hidden p-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem]">
                  <GameCover name={game.name} src={game.background_image ?? game.cover_image} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-medium sm:text-3xl">{game.name}</h2>
                      <p className="mt-1 text-sm text-white/50">{releaseYear}</p>
                    </div>
                    {game.rating != null && <span className="flex items-center gap-1 text-sm text-white/75"><Star className="h-4 w-4 fill-current" /> {game.rating.toFixed(1)}</span>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {game.genres.map((genre) => {
                      const color = genreByKey(genre.slug)?.hex ?? "#b9a7ff";
                      return <span key={genre.slug} className="chip" style={{ borderColor: `${color}66`, color }}>{genre.name}</span>;
                    })}
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/60">{game.description ?? "No description available for this game yet."}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link to={`/game/${game.slug}`} className="btn-primary no-underline w-full flex-1">Inspect game <ArrowRight className="h-4 w-4" /></Link>
                    <GlassButton onClick={() => advance()} aria-label="Pass on this game"><X className="h-4 w-4" /> Pass</GlassButton>
                    <GlassButton onClick={() => void wishlist()} disabled={wishlistBusy} aria-label={user ? "Add game to wishlist" : "Sign in to add game to wishlist"}><Heart className="h-4 w-4" /> {user ? "Wishlist" : "Sign in"}</GlassButton>
                  </div>
                  {notice && <p role="status" className="mt-3 text-center text-xs text-white/60">{notice}</p>}
                </div>
              </GlassCard>
            </motion.div>
        </div>
      </div>
    </main>
  );
}
