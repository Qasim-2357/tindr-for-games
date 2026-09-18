"use client";

import { type FormEvent, useEffect, useState } from "react";
import { GameCard } from "@/components/game-card";
import {
  getNewReleases,
  getGames,
  getPopularGames,
  searchGames,
  getTrendingGames,
  type Game,
} from "@/lib/api";

type SectionState = {
  games: Game[];
  status: "loading" | "ready" | "error";
};

const initialSectionState: SectionState = {
  games: [],
  status: "loading",
};

function GameSection({
  title,
  section,
}: {
  title: string;
  section: SectionState;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-2xl font-semibold text-gray-900">{title}</h2>
      {section.status === "loading" && (
        <p className="text-gray-600" role="status">
          Loading games...
        </p>
      )}
      {section.status === "error" && (
        <p className="text-red-600" role="alert">
          We could not load this section right now.
        </p>
      )}
      {section.status === "ready" && section.games.length === 0 && (
        <p className="text-gray-600">No games found.</p>
      )}
      {section.status === "ready" && section.games.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {section.games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [filteredResults, setFilteredResults] =
    useState<SectionState | null>(null);
  const [searchResults, setSearchResults] = useState<SectionState | null>(null);
  const [sections, setSections] = useState({
    trending: initialSectionState,
    popular: initialSectionState,
    newReleases: initialSectionState,
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    setSearchResults({ games: [], status: "loading" });
    searchGames(trimmedQuery)
      .then((result) => {
        setSearchResults({ games: result.items, status: "ready" });
      })
      .catch(() => {
        setSearchResults({ games: [], status: "error" });
      });
  }

  function handleFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilteredResults({ games: [], status: "loading" });

    getGames({ genres: genre, platforms: platform })
      .then((result) => {
        setFilteredResults({ games: result.items, status: "ready" });
      })
      .catch(() => {
        setFilteredResults({ games: [], status: "error" });
      });
  }

  useEffect(() => {
    const loadSection = (
      key: keyof typeof sections,
      request: () => Promise<{ items: Game[] }>,
    ) => {
      request()
        .then((result) => {
          setSections((current) => ({
            ...current,
            [key]: { games: result.items, status: "ready" },
          }));
        })
        .catch(() => {
          setSections((current) => ({
            ...current,
            [key]: { games: [], status: "error" },
          }));
        });
    };

    loadSection("trending", getTrendingGames);
    loadSection("popular", getPopularGames);
    loadSection("newReleases", getNewReleases);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover</h1>
          <p className="mt-2 text-gray-600">Find your next game.</p>
          <form
            onSubmit={handleSearch}
            className="mt-6 flex max-w-xl gap-3"
            role="search"
          >
            <label htmlFor="game-search" className="sr-only">
              Search games
            </label>
            <input
              id="game-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white"
            >
              Search
            </button>
          </form>
          <form
            onSubmit={handleFilters}
            className="mt-4 flex max-w-xl flex-wrap gap-3"
          >
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-gray-700">
              Genre
              <select
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              >
                <option value="">All genres</option>
                <option value="action">Action</option>
                <option value="adventure">Adventure</option>
                <option value="indie">Indie</option>
                <option value="rpg">RPG</option>
                <option value="strategy">Strategy</option>
              </select>
            </label>
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-gray-700">
              Platform
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              >
                <option value="">All platforms</option>
                <option value="4">PC</option>
                <option value="18">PlayStation 4</option>
                <option value="187">PlayStation 5</option>
                <option value="1">Xbox One</option>
                <option value="186">Xbox Series S/X</option>
                <option value="7">Nintendo Switch</option>
              </select>
            </label>
            <button
              type="submit"
              className="self-end rounded-lg border border-gray-900 px-4 py-2 font-medium text-gray-900"
            >
              Apply Filters
            </button>
          </form>
        </header>

        {searchResults && (
          <GameSection title="Search Results" section={searchResults} />
        )}
        {filteredResults && (
          <GameSection title="Filtered Games" section={filteredResults} />
        )}
        <GameSection title="Trending Games" section={sections.trending} />
        <GameSection title="Popular Games" section={sections.popular} />
        <GameSection title="New Releases" section={sections.newReleases} />
      </div>
    </main>
  );
}
