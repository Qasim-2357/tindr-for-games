"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getGameBySlug, type Game } from "@/lib/api";

export default function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">(
    "loading",
  );

  useEffect(() => {
    getGameBySlug(slug)
      .then((result) => {
        setGame(result);
        setStatus(result ? "ready" : "not-found");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [slug]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-600">
        Loading game...
      </main>
    );
  }

  if (status === "not-found") {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-600">
        Game not found.
      </main>
    );
  }

  if (status === "error" || !game) {
    return (
      <main
        className="min-h-screen bg-gray-50 px-6 py-12 text-red-600"
        role="alert"
      >
        We could not load this game right now.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10">
      <article className="mx-auto max-w-5xl">
        <Link
          href="/discover"
          className="mb-6 inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
        >
          Back to Discover
        </Link>

        {game.background_image && (
          <div className="relative h-56 overflow-hidden rounded-2xl bg-gray-900 sm:h-72">
            <Image
              src={game.background_image}
              alt={`${game.name} background`}
              fill
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-900/20 to-transparent" />
            <h1 className="absolute bottom-6 left-6 right-6 text-3xl font-bold text-white sm:text-4xl">
              {game.name}
            </h1>
          </div>
        )}

        <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
          {game.cover_image ? (
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
              <Image
                src={game.cover_image}
                alt={`${game.name} cover`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-gray-200 px-6 text-center text-sm text-gray-500">
              No cover image
            </div>
          )}
          <div className="space-y-6">
            {!game.background_image && (
              <h1 className="text-3xl font-bold text-gray-900">{game.name}</h1>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {game.rating !== null && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {game.rating.toFixed(1)}
                  </p>
                </div>
              )}
              {game.metacritic !== null && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Metacritic</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {game.metacritic}
                  </p>
                </div>
              )}
              {game.release_date && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Release date</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {game.release_date}
                  </p>
                </div>
              )}
            </div>
            {game.description && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  About this game
                </h2>
                <p className="whitespace-pre-line leading-7 text-gray-700">
                  {game.description}
                </p>
              </section>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
