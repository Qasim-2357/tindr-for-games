import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Heart, Star, Users } from "lucide-react";
import { api, ApiError } from "../api";
import { piece, stagger } from "../lib/motion";
import { useAuth } from "../context/AuthContext";
import type { Game } from "../types";
import GameCover from "../components/GameCover";
import GlassCard from "../components/GlassCard";
import Reveal from "../components/Reveal";

export default function GameDetailPage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [wishlistNotice, setWishlistNotice] = useState<string | null>(null);
  const [failedScreenshots, setFailedScreenshots] = useState<Set<string>>(new Set());

  useEffect(() => {
    setGame(null); setError(null);
    api.gameBySlug(slug).then((data) => {
      console.log("[GameDetailPage] API game:", data);
      setGame(data);
    }).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load this game."));
  }, [slug]);

  useEffect(() => {
    if (!game || !user) {
      setWishlisted(false);
      return;
    }
    let active = true;
    setWishlisted(false);
    setWishlistError(null);
    setWishlistNotice(null);
    setFailedScreenshots(new Set());
    api.wishlistStatus(game.id)
      .then((status) => {
        if (active) setWishlisted(status.wishlisted);
      })
      .catch((error) => {
        if (!active) return;
        setWishlisted(false);
        if (error instanceof ApiError && error.status === 401) {
          setWishlistError(null);
          return;
        }
        setWishlistError(error instanceof ApiError ? error.message : "Couldn't load wishlist status.");
      });
    return () => { active = false; };
  }, [game, user]);

  useEffect(() => {
    if (!wishlistNotice) return;
    const timeout = window.setTimeout(() => setWishlistNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [wishlistNotice]);

  const toggleWishlist = async () => {
    if (!game || wishlistBusy) return;
    if (!user) {
      setWishlistNotice("Sign in to add games to your wishlist.");
      return;
    }
    setWishlistBusy(true);
    setWishlistError(null);
    setWishlistNotice(null);
    try {
      if (wishlisted) {
        await api.removeFromWishlist(game.id);
        setWishlisted(false);
      } else {
        const response = await api.addToWishlist(game.id);
        setWishlisted(response.wishlisted);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setWishlisted(false);
        setWishlistError(null);
      } else {
        setWishlistError(e instanceof ApiError ? e.message : "Couldn't update your wishlist.");
      }
    } finally {
      setWishlistBusy(false);
    }
  };

  const date = game?.release_date ? new Date(game.release_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Release date TBA";
  const long = (game?.description?.length ?? 0) > 420;
  const visibleScreenshots = game?.screenshots?.filter((src) => !failedScreenshots.has(src)) ?? [];

  console.log("[GameDetailPage] game:", game);
  console.log("[GameDetailPage] screenshots:", game?.screenshots);
  console.log("[GameDetailPage] screenshot count:", game?.screenshots?.length);
  console.log("[GameDetailPage] open:", open);
  console.log(
    "[GameDetailPage] gallery condition:",
    Boolean(open && game?.screenshots?.length)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <Link to="/discover" className="chip glass mb-5 !px-4 !py-2 transition-colors hover:bg-white/15"><ArrowLeft className="h-4 w-4" /> Back to discover</Link>

      {error && <GlassCard className="p-10 text-center text-white/75">{error}</GlassCard>}

      {!game && !error && (
        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="glass p-2"><div className="skeleton aspect-[4/3] !rounded-[1.1rem] md:aspect-auto md:min-h-96" /></div>
          <div className="glass space-y-4 p-8"><div className="skeleton h-8 w-3/4" /><div className="skeleton h-4 w-1/2" /><div className="skeleton h-24 w-full" /></div>
        </div>
      )}

      {game && (
        <motion.div variants={stagger(0.14, 0.05)} initial="hidden" animate="show" className="grid items-start gap-4 md:grid-cols-[1.1fr_1fr]">
          {/* Piece: the picture */}
          <GlassCard variants={piece} className="h-fit bg-[#07070a] p-2 sm:p-2.5">
            <div>
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[0.95rem] bg-black/30 md:min-h-[26rem]">
                {game.background_image || game.cover_image ? (
                  <img
                    src={game.background_image ?? game.cover_image ?? undefined}
                    alt={game.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <GameCover name={game.name} src={null} />
                )}
              </div>
              {open && visibleScreenshots.length ? (
                <motion.div
                  variants={piece}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.45 }}
                  className="min-w-0"
                >
                  <h2 className="mt-4 px-1 font-display text-xl font-medium">Screenshots</h2>
                  <div className="mt-4 flex flex-col gap-6">
                    {visibleScreenshots.map((src) => (
                      <div key={src} className="h-56 sm:h-64 md:h-72">
                        <img
                          src={src}
                          alt={`${game.name} screenshot`}
                          loading="lazy"
                          className="block h-full w-full rounded-xl border border-white/10 bg-black/30 object-contain"
                          onError={() => setFailedScreenshots((current) => new Set(current).add(src))}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </div>
          </GlassCard>

          <div className="flex flex-col gap-4 md:col-start-2 md:row-start-1">
            {/* Piece: title + facts */}
            <GlassCard
              variants={piece}
              initial="hidden"
              animate="show"
              className="p-6 sm:p-8"
            >
              <h1 className="font-display text-3xl font-medium sm:text-4xl"><Reveal text={game.name} delay={0.25} /></h1>
              <div className="mt-5 flex flex-wrap gap-2">
                {game.rating != null && <span className="chip"><Star className="h-3.5 w-3.5 fill-current" />{game.rating.toFixed(1)} / 5</span>}
                {game.rating_count != null && <span className="chip"><Users className="h-3.5 w-3.5" />{game.rating_count.toLocaleString()} ratings</span>}
                {game.metacritic != null && <span className="chip">Metacritic {game.metacritic}</span>}
                <span className="chip"><Calendar className="h-3.5 w-3.5" />{date}</span>
                <button
                  type="button"
                  className={`btn-glass !h-auto !min-h-8 !px-3 !py-1.5 ${wishlisted ? "bg-white/12 text-white" : ""}`}
                  onClick={toggleWishlist}
                  disabled={wishlistBusy}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-current" : ""}`} />
                  {wishlistBusy ? "Saving..." : wishlisted ? "In wishlist" : "Add to wishlist"}
                </button>
              </div>
              {wishlistError && <p role="status" className="mt-3 text-sm text-white/60">{wishlistError}</p>}
              {wishlistNotice && <p role="status" className="mt-3 text-sm text-white/70">{wishlistNotice}</p>}
            </GlassCard>

            {/* Piece: description */}
            <GlassCard variants={piece} className="p-6 sm:p-8">
              <p className={`leading-relaxed text-white/70 ${!open && long ? "line-clamp-6" : ""}`}>
                {game.description ?? "No description available for this game yet."}
              </p>
              {long && (
                <button onClick={() => setOpen(!open)} className="mt-3 text-sm font-medium text-white/90 underline underline-offset-4">
                  {open ? "Show less" : "Read more"}
                </button>
              )}
            </GlassCard>
          </div>
        </motion.div>
      )}
    </div>
  );
}
