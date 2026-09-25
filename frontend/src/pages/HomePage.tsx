import { useEffect, useState } from "react";
import { ArrowRight, Compass, Heart, MessageSquareText, Sparkles, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { DailyGame, Game, RecommendationGame, WishlistGame } from "../types";
import GameCard, { GameCardSkeleton } from "../components/GameCard";
import GameCover from "../components/GameCover";
import GlassCard from "../components/GlassCard";

type LoadStatus = "loading" | "ready" | "unavailable";

const pathways = [
  {
    icon: Compass,
    eyebrow: "Explore",
    title: "Find your next world",
    copy: "Browse a living library shaped around the games and genres you want to feel.",
    href: "/discover",
  },
  {
    icon: TrendingUp,
    eyebrow: "Right now",
    title: "See what is moving",
    copy: "Keep up with trending, top-rated, and newly released games in one place.",
    href: "/daily",
  },
  {
    icon: Sparkles,
    eyebrow: "Personal",
    title: "Make it yours",
    copy: "Choose an identity colour and let your taste guide the way you discover.",
    href: "/profile",
  },
];

const railClass = "-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4";
const railItemClass = "min-w-[72%] snap-start sm:min-w-0";

function toCardGame(item: RecommendationGame | WishlistGame): Game {
  const isWishlistItem = "game_id" in item;
  const id = isWishlistItem ? item.game_id : item.id;
  const createdAt = isWishlistItem ? item.created_at : "";

  return {
    id,
    external_id: String(id),
    external_provider: isWishlistItem ? "wishlist" : "recommendations",
    name: item.name,
    slug: item.slug,
    description: null,
    release_date: item.release_date,
    rating: item.rating,
    rating_count: null,
    metacritic: null,
    cover_image: item.cover_image,
    background_image: null,
    screenshots: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const userId = user?.id;
  const secondaryHref = user ? "/profile" : "/auth";
  const secondaryLabel = user ? "Your profile" : "Sign in";
  const personalHref = user ? "/profile" : "/auth";

  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [popularStatus, setPopularStatus] = useState<LoadStatus>("loading");
  const [dailyGame, setDailyGame] = useState<DailyGame | null>(null);
  const [dailyStatus, setDailyStatus] = useState<LoadStatus>("loading");
  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [recommendationsStatus, setRecommendationsStatus] = useState<LoadStatus>("loading");
  const [savedGames, setSavedGames] = useState<Game[]>([]);
  const [wishlistStatus, setWishlistStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    let active = true;

    api.popular(1, 4)
      .then((response) => {
        if (!active) return;
        setPopularGames(response.items);
        setPopularStatus("ready");
      })
      .catch(() => { if (active) setPopularStatus("unavailable"); });

    api.daily(1, 1)
      .then((response) => {
        if (!active) return;
        setDailyGame(response.items[0] ?? null);
        setDailyStatus("ready");
      })
      .catch(() => { if (active) setDailyStatus("unavailable"); });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    if (userId == null) {
      setRecommendations([]);
      setSavedGames([]);
      setRecommendationsStatus("ready");
      setWishlistStatus("ready");
      return () => { active = false; };
    }

    setRecommendations([]);
    setSavedGames([]);
    setRecommendationsStatus("loading");
    setWishlistStatus("loading");

    api.recommendations(1, 4)
      .then((response) => {
        if (!active) return;
        setRecommendations(response.items.map(toCardGame));
        setRecommendationsStatus("ready");
      })
      .catch(() => { if (active) setRecommendationsStatus("unavailable"); });

    api.wishlist()
      .then((response) => {
        if (!active) return;
        setSavedGames(response.slice(0, 4).map(toCardGame));
        setWishlistStatus("ready");
      })
      .catch(() => { if (active) setWishlistStatus("unavailable"); });

    return () => { active = false; };
  }, [userId]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8 sm:pt-8">
      <section className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center py-16 text-center sm:py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-6xl"
        >
          <p className="auth-kicker mb-5">A library with a pulse</p>
          <h1 className="font-display text-[clamp(4rem,13vw,10.5rem)] font-semibold leading-[0.86] tracking-[-0.08em] text-white">
            Tindr <span className="text-white/55">for</span> Games
          </h1>
          <p className="mx-auto mt-8 max-w-md text-sm leading-6 text-white/45">
            An interactive library for finding the worlds that fit how you feel.
          </p>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-14 text-xs uppercase tracking-[0.22em] text-white/30"
        >
          Scroll to discover
        </motion.span>
      </section>

      <section className="grid min-h-[calc(100dvh-7rem)] items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="hero-piece max-w-2xl"
        >
          <p className="auth-kicker">A library with a pulse</p>
          <h2 className="font-display text-5xl font-semibold leading-[1.02] sm:text-7xl">
            Discover by
            <span className="block text-white/55">how it feels.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/60 sm:text-lg">
            Tindr for Games helps you find the worlds that fit your mood, your
            taste, and the kind of player you are today.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/discover" className="btn-primary no-underline">
              {user ? "Open discover" : "Start discovering"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to={secondaryHref} className="btn-glass no-underline">{secondaryLabel}</Link>
          </div>
          <div className="mt-10 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/35">
            <span className="h-px w-8 bg-white/20" />
            One feeling at a time
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          {pathways.map(({ icon: Icon, eyebrow, title, copy, href }, index) => (
            <Link key={title} to={index === 2 ? personalHref : href} className="block rounded-[1.25rem]">
              <GlassCard
                className="p-5 sm:p-6"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.7 }}
              >
                <div className="flex gap-4">
                  <span className="glass-control flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white/75">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/35">{eyebrow}</p>
                    <h3 className="mt-1 font-display text-lg font-medium text-white">{title}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">{copy}</p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </motion.div>
      </section>

      <section id="popular-games" aria-labelledby="popular-heading" className="mt-16 sm:mt-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="auth-kicker">Highest-rated from the library</p>
            <h2 id="popular-heading" className="font-display text-3xl font-medium sm:text-4xl">Popular right now</h2>
          </div>
          <Link to="/discover" className="hidden items-center gap-2 text-sm text-white/60 transition-colors hover:text-white sm:flex">
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {popularStatus === "loading" ? (
          <div className={railClass}>
            {Array.from({ length: 4 }, (_, index) => <div key={index} className={railItemClass}><GameCardSkeleton /></div>)}
          </div>
        ) : popularGames.length > 0 ? (
          <div className={railClass}>
            {popularGames.map((game, index) => <div key={game.id} className={railItemClass}><GameCard game={game} index={index} /></div>)}
          </div>
        ) : (
          <GlassCard className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/60">
              {popularStatus === "unavailable" ? "Popular games are unavailable right now." : "The catalogue is quiet right now."}
              {" "}You can still explore the full library.
            </p>
            <Link to="/discover" className="btn-glass no-underline">Browse games <ArrowRight className="h-4 w-4" /></Link>
          </GlassCard>
        )}
      </section>

      <section aria-labelledby="made-for-you-heading" className="mt-20 sm:mt-28">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="auth-kicker">A better next pick</p>
            <h2 id="made-for-you-heading" className="font-display text-3xl font-medium sm:text-4xl">Made for you</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Recommendations are shaped by the genres in your saved games.</p>
          </div>
          {user && <Link to="/discover" className="hidden items-center gap-2 text-sm text-white/60 transition-colors hover:text-white sm:flex">See more <ArrowRight className="h-4 w-4" /></Link>}
        </div>

        {!user ? (
          <GlassCard className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-xl">
              <h3 className="font-display text-xl font-medium">Start with what players love</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">Browse popular games now. Sign in and save a few favorites to get recommendations from the genres in your collection.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link to="/discover" className="btn-glass no-underline">Browse popular games</Link>
              <Link to="/auth" className="btn-primary no-underline">Sign in <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </GlassCard>
        ) : recommendationsStatus === "loading" ? (
          <div className={railClass}>
            {Array.from({ length: 4 }, (_, index) => <div key={index} className={railItemClass}><GameCardSkeleton /></div>)}
          </div>
        ) : recommendations.length > 0 ? (
          <div className={railClass}>
            {recommendations.map((game, index) => <div key={game.id} className={railItemClass}><GameCard game={game} index={index} /></div>)}
          </div>
        ) : (
          <GlassCard className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-white/60">
              {recommendationsStatus === "unavailable"
                ? "Your recommendations are unavailable right now. You can still explore the library."
                : "Save a few games to your wishlist and we can find more from the genres in your collection."}
            </p>
            <Link to="/discover" className="btn-glass no-underline">Explore games <ArrowRight className="h-4 w-4" /></Link>
          </GlassCard>
        )}
      </section>

      <section aria-labelledby="daily-game-heading" className="mt-20 sm:mt-28">
        <div className="mb-6">
          <p className="auth-kicker">A fresh pick every day</p>
          <h2 id="daily-game-heading" className="font-display text-3xl font-medium sm:text-4xl">Your daily game</h2>
        </div>

        {dailyStatus === "loading" ? (
          <GlassCard className="grid gap-5 p-3 md:grid-cols-2">
            <div className="skeleton aspect-[4/3] !rounded-[1rem]" />
            <div className="space-y-4 p-4 sm:p-7"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-8 w-3/4" /><div className="skeleton h-16 w-full" /><div className="skeleton h-11 w-40" /></div>
          </GlassCard>
        ) : dailyGame ? (
          <GlassCard className="overflow-hidden p-1.5">
            <div className="grid md:grid-cols-[1.05fr_0.95fr]">
              <Link to={`/game/${dailyGame.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-[1rem] md:aspect-auto md:min-h-[22rem]">
                <GameCover name={dailyGame.name} src={dailyGame.background_image ?? dailyGame.cover_image} className="transition-transform duration-700 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
                <span className="glass glass-pill absolute left-4 top-4 px-3 py-1.5 text-xs text-white/80">Today's pick</span>
              </Link>
              <div className="flex flex-col items-start justify-center p-5 sm:p-8 lg:p-10">
                <p className="auth-kicker">A new world to step into</p>
                <h3 className="mt-2 font-display text-2xl font-medium sm:text-3xl">{dailyGame.name}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/55">One considered pick from the library, refreshed daily. Open the deck to explore today's selection.</p>
                {dailyGame.genres.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {dailyGame.genres.slice(0, 3).map((genre) => <span key={genre.slug} className="chip">{genre.name}</span>)}
                  </div>
                )}
                <div className="mt-6 flex w-full flex-wrap items-center gap-3">
                  {dailyGame.rating != null && dailyGame.rating > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-white/75"><Star className="h-4 w-4 fill-current" />{dailyGame.rating.toFixed(1)}</span>
                  )}
                  <Link to="/daily" className="btn-primary no-underline">Open Daily Game <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <p className="max-w-xl text-sm leading-6 text-white/60">
              {dailyStatus === "unavailable" ? "Today's pick is unavailable right now." : "There isn't a daily pick available just yet."}
              {" "}Check the daily deck again soon, or keep exploring.
            </p>
            <Link to="/daily" className="btn-primary no-underline">Open Daily Game <ArrowRight className="h-4 w-4" /></Link>
          </GlassCard>
        )}
      </section>

      <section aria-labelledby="ai-finder-heading" className="mt-20 sm:mt-28">
        <GlassCard className="grid gap-7 overflow-hidden p-6 sm:p-9 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="auth-kicker">AI game finder</p>
            <h2 id="ai-finder-heading" className="mt-2 max-w-xl font-display text-3xl font-medium sm:text-4xl">Tell us what you want to play.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">
              Describe the mood, mechanics, or world you're after. Discover will match your words against games in the library.
              {!user && " Sign in to use AI recommendations."}
            </p>
            <Link to={user ? "/discover" : "/auth"} className="btn-primary mt-6 no-underline">
              {user ? "Try AI Game Finder" : "Sign in to try AI Game Finder"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="glass glass-pill flex min-h-36 flex-col justify-center gap-3 rounded-2xl px-5 py-6 sm:px-7">
            <Sparkles className="h-4 w-4 text-white/65" />
            <p className="font-display text-lg leading-7 text-white/75">“A dark psychological horror game with puzzles and a story that stays with me.”</p>
            <span className="text-xs uppercase tracking-[0.16em] text-white/35">A prompt to start from</span>
          </div>
        </GlassCard>
      </section>

      <section aria-labelledby="wishlist-heading" className="mt-20 sm:mt-28">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="auth-kicker">Keep your next plays close</p>
            <h2 id="wishlist-heading" className="font-display text-3xl font-medium sm:text-4xl">Your collection</h2>
          </div>
          {user && wishlistStatus === "ready" && savedGames.length > 0 && (
            <Link to="/wishlist" className="hidden items-center gap-2 text-sm text-white/60 transition-colors hover:text-white sm:flex">Open wishlist <ArrowRight className="h-4 w-4" /></Link>
          )}
        </div>

        {!user ? (
          <GlassCard className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <Heart className="mt-1 h-5 w-5 shrink-0 text-white/65" />
              <div>
                <h3 className="font-display text-xl font-medium">Build a collection for later</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">Sign in to save games as you explore and keep your next plays in one place.</p>
              </div>
            </div>
            <Link to="/auth" className="btn-glass no-underline">Sign in <ArrowRight className="h-4 w-4" /></Link>
          </GlassCard>
        ) : wishlistStatus === "loading" ? (
          <div className={railClass}>
            {Array.from({ length: 4 }, (_, index) => <div key={index} className={railItemClass}><GameCardSkeleton /></div>)}
          </div>
        ) : savedGames.length > 0 ? (
          <div className={railClass}>
            {savedGames.map((game, index) => <div key={game.id} className={railItemClass}><GameCard game={game} index={index} /></div>)}
          </div>
        ) : (
          <GlassCard className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-white/60">
              {wishlistStatus === "unavailable" ? "Your collection is unavailable right now." : "Nothing saved yet. Find a game that feels like yours and keep it close."}
            </p>
            <Link to={wishlistStatus === "unavailable" ? "/wishlist" : "/discover"} className="btn-glass no-underline">
              {wishlistStatus === "unavailable" ? "Open wishlist" : "Discover games"} <ArrowRight className="h-4 w-4" />
            </Link>
          </GlassCard>
        )}
      </section>

      <section aria-labelledby="community-heading" className="mt-20 border-y border-white/10 py-12 sm:mt-28 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-2xl items-start gap-4">
            <span className="glass-control mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white/70">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div>
              <p className="auth-kicker">Community</p>
              <h2 id="community-heading" className="font-display text-2xl font-medium sm:text-3xl">Play. Discover. Talk.</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">Every game page has a place to leave comments, reply to other players, and share what stayed with you.</p>
            </div>
          </div>
          <Link to="/discover" className="btn-glass w-fit shrink-0 no-underline">Find a game to discuss <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
