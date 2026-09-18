"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getCurrentUser, updateProfile } from "@/lib/api";
import type { User } from "@/lib/api";

const IDENTITY_GENRE_COLORS = {
  horror: "purple",
  action: "red",
  adventure: "blue",
  rpg: "gold",
  strategy: "green",
  indie: "pink",
} as const;

type IdentityGenre = keyof typeof IDENTITY_GENRE_COLORS;

const identityOptions: Array<{ value: IdentityGenre; label: string }> = [
  { value: "horror", label: "Horror" },
  { value: "action", label: "Action" },
  { value: "adventure", label: "Adventure" },
  { value: "rpg", label: "RPG" },
  { value: "strategy", label: "Strategy" },
  { value: "indie", label: "Indie" },
];

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [genre, setGenre] = useState<IdentityGenre | "">("");
  const [identityChanged, setIdentityChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!mounted) {
          return;
        }
        setUser(currentUser);
        setUsername(currentUser.username);
        setGenre(
          currentUser.identity_genre &&
            currentUser.identity_genre in IDENTITY_GENRE_COLORS
            ? (currentUser.identity_genre as IdentityGenre)
            : "",
        );
      })
      .catch(() => {
        if (mounted) {
          setError("Unable to load your settings.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const payload: {
      username: string;
      identity_genre?: string | null;
      identity_color?: string;
    } = { username: username.trim() };

    if (identityChanged) {
      if (genre) {
        payload.identity_genre = genre;
        payload.identity_color = IDENTITY_GENRE_COLORS[genre];
      } else {
        payload.identity_genre = null;
      }
    }

    try {
      const updatedUser = await updateProfile(payload);
      setUser(updatedUser);
      setUsername(updatedUser.username);
      setGenre(
        updatedUser.identity_genre &&
          updatedUser.identity_genre in IDENTITY_GENRE_COLORS
          ? (updatedUser.identity_genre as IdentityGenre)
          : "",
      );
      setIdentityChanged(false);
      setSuccess("Settings saved.");
    } catch {
      setError("Unable to save your settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedColor = genre ? IDENTITY_GENRE_COLORS[genre] : null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p>Loading settings...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p>{error ?? "Unable to load your settings."}</p>
        <Link href="/" className="underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href="/" className="text-sm underline">
            Back to home
          </Link>
        </div>

        <label className="flex flex-col gap-1">
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          Identity genre
          <select
            value={genre}
            onChange={(event) => {
              setGenre(event.target.value as IdentityGenre | "");
              setIdentityChanged(true);
              setSuccess(null);
            }}
            className="rounded border px-3 py-2"
          >
            <option value="">No identity</option>
            {identityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {selectedColor && (
          <p className="flex items-center gap-2 text-sm text-gray-600">
            Color:
            <span className="flex items-center gap-1">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: selectedColor }}
              />
              {selectedColor}
            </span>
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </main>
  );
}
