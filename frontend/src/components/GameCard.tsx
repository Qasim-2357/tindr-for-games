import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Star } from "lucide-react";
import type { Game } from "../types";
import { ease, piece, stagger } from "../lib/motion";
import { trackPointer } from "../lib/spotlight";
import GameCover from "./GameCover";

/** One game = two separate glass pieces: the picture, and its info. The pair tilts gently toward your cursor. */
export default function GameCard({ game, index = 0 }: { game: Game; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const soft = { stiffness: 140, damping: 26 }; // critically damped: no wobble
  const rx = useSpring(useMotionValue(0), soft);
  const ry = useSpring(useMotionValue(0), soft);
  const year = game.release_date?.slice(0, 4);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = ref.current!.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      variants={stagger(0.1, (index % 4) * 0.07)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={{ scale: 1.02, transition: { duration: 0.5, ease } }}
      className="group"
    >
      <Link to={`/game/${game.slug}`} className="block">
        {/* Piece 1: the picture */}
        <motion.div variants={piece} onPointerMove={trackPointer} className="glass glass-interactive p-1.5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[0.9rem]">
            <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-105">
              <GameCover name={game.name} src={game.cover_image ?? game.background_image} />
            </div>
            {game.metacritic != null && (
              <span className="absolute right-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white/90 backdrop-blur-md">
                {game.metacritic}
              </span>
            )}
          </div>
        </motion.div>

        {/* Piece 2: its info */}
        <motion.div variants={piece} onPointerMove={trackPointer} className="glass glass-interactive mt-2 rounded-[1rem] px-4 py-3">
          <h3 className="font-display line-clamp-1 text-sm font-medium sm:text-[0.95rem]">{game.name}</h3>
          <div className="mt-1 flex items-center justify-between text-xs text-white/50 sm:text-sm">
            <span>{year ?? "TBA"}</span>
            {game.rating != null && game.rating > 0 && (
              <span className="flex items-center gap-1 text-white/80"><Star className="h-3.5 w-3.5 fill-current" />{game.rating.toFixed(1)}</span>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function GameCardSkeleton() {
  return (
    <div>
      <div className="glass p-1.5"><div className="skeleton aspect-[4/3] !rounded-[0.9rem]" /></div>
      <div className="glass mt-2 space-y-2 rounded-[1rem] px-4 py-3.5"><div className="skeleton h-3.5 w-3/4" /><div className="skeleton h-3 w-1/3" /></div>
    </div>
  );
}
