import Image from "next/image";
import Link from "next/link";

import type { Game } from "@/lib/api";

type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const imageUrl = game.cover_image ?? game.background_image;

  return (
    <Link href={`/games/${game.slug}`} className="block">
      <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {imageUrl ? (
          <div className="relative aspect-[3/4]">
            <Image
              src={imageUrl}
              alt={`${game.name} cover`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center bg-gray-100 px-4 text-center text-sm text-gray-500">
            No cover image
          </div>
        )}
        <div className="space-y-2 p-4">
          <h2 className="font-semibold text-gray-900">{game.name}</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
            {game.rating !== null && (
              <span>Rating: {game.rating.toFixed(1)}</span>
            )}
            {game.release_date && <span>Released: {game.release_date}</span>}
            {game.metacritic !== null && (
              <span>Metacritic: {game.metacritic}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
