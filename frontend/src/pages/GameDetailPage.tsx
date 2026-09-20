import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Star, Users } from "lucide-react";
import { api, ApiError } from "../api";
import { piece, stagger } from "../lib/motion";
import type { Game } from "../types";
import GameCover from "../components/GameCover";
import GlassCard from "../components/GlassCard";
import Reveal from "../components/Reveal";

export default function GameDetailPage() {
  const { slug = "" } = useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setGame(null); setError(null);
    api.gameBySlug(slug).then(setGame).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load this game."));
  }, [slug]);

  const date = game?.release_date ? new Date(game.release_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Release date TBA";
  const long = (game?.description?.length ?? 0) > 420;

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
          <GlassCard variants={piece} className="p-2 sm:p-2.5">
            <div className="aspect-[4/3] overflow-hidden rounded-[0.95rem] md:aspect-auto md:min-h-[26rem]">
              <GameCover name={game.name} src={game.background_image ?? game.cover_image} />
            </div>
          </GlassCard>

          <div className="flex flex-col gap-4">
            {/* Piece: title + facts */}
            <GlassCard variants={piece} className="p-6 sm:p-8">
              <h1 className="font-display text-3xl font-medium sm:text-4xl"><Reveal text={game.name} delay={0.25} /></h1>
              <div className="mt-5 flex flex-wrap gap-2">
                {game.rating != null && <span className="chip"><Star className="h-3.5 w-3.5 fill-current" />{game.rating.toFixed(1)} / 5</span>}
                {game.rating_count != null && <span className="chip"><Users className="h-3.5 w-3.5" />{game.rating_count.toLocaleString()} ratings</span>}
                {game.metacritic != null && <span className="chip">Metacritic {game.metacritic}</span>}
                <span className="chip"><Calendar className="h-3.5 w-3.5" />{date}</span>
              </div>
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
