import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Heart, RefreshCw } from "lucide-react";
import { api, ApiError } from "../api";
import type { Game, WishlistGame } from "../types";
import GameCard, { GameCardSkeleton } from "../components/GameCard";
import GlassButton from "../components/GlassButton";
import GlassCard from "../components/GlassCard";

function toGame(item: WishlistGame): Game {
  return {
    id: item.game_id,
    external_id: String(item.game_id),
    external_provider: "wishlist",
    name: item.name,
    slug: item.slug,
    description: null,
    release_date: item.release_date,
    rating: item.rating,
    rating_count: null,
    metacritic: null,
    cover_image: item.cover_image,
    background_image: null,
    created_at: item.created_at,
    updated_at: item.created_at,
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api.wishlist()
      .then((wishlist) => setItems(wishlist.map(toGame)))
      .catch((err) => setError(err instanceof ApiError ? err : new ApiError(0, "Couldn't load your wishlist.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-white/75" />
          <h1 className="font-display text-3xl font-medium sm:text-5xl">Your wishlist</h1>
        </div>
        <p className="mt-3 text-white/60">Keep track of the games you want to play next.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <GameCardSkeleton key={index} />)}
        </div>
      )}

      {!loading && error?.status === 401 && (
        <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <Heart className="h-6 w-6 text-white/65" />
          <div>
            <h2 className="font-display text-xl font-medium">Sign in to see your wishlist</h2>
            <p className="mt-2 text-sm text-white/55">Save games while you discover your next favorite.</p>
          </div>
          <Link to="/auth"><GlassButton variant="primary">Sign in</GlassButton></Link>
        </GlassCard>
      )}

      {!loading && error && error.status !== 401 && (
        <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="h-6 w-6 text-white/65" />
          <p className="text-white/75">{error.message}</p>
          <GlassButton onClick={load}><RefreshCw className="h-4 w-4" /> Try again</GlassButton>
        </GlassCard>
      )}

      {!loading && !error && items.length === 0 && (
        <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <Heart className="h-6 w-6 text-white/65" />
          <div>
            <h2 className="font-display text-xl font-medium">Nothing saved yet</h2>
            <p className="mt-2 text-sm text-white/55">Add games to your wishlist while exploring.</p>
          </div>
          <Link to="/discover"><GlassButton variant="primary">Discover games</GlassButton></Link>
        </GlassCard>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {items.map((game, index) => <GameCard key={game.id} game={game} index={index} />)}
        </div>
      )}
    </main>
  );
}
