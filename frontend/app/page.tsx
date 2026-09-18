"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, getHealth, logout } from "@/lib/api";
import type { User } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState<"loading" | "connected" | "disconnected">(
    "loading",
  );
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    getHealth()
      .then((result) => {
        if (!mounted) {
          return;
        }
        setStatus(result.status === "ok" ? "connected" : "disconnected");
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setStatus("disconnected");
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
    .then((currentUser) => {
      if (mounted) {
        setUser(currentUser);
      }
    })
    .catch(() => {
      if (mounted) {
        setUser(null);
      }
    })
    .finally(() => {
      if (mounted) {
        setAuthLoading(false);
      }
    });

    return () => {
    mounted = false;
    };
  }, []);

  async function handleLogout() {
    setLogoutLoading(true);
    try {
    await logout();
    try {
      setUser(await getCurrentUser());
    } catch {
      setUser(null);
    }
    } catch {
    // Keep the current user visible when logout cannot be completed.
    } finally {
    setLogoutLoading(false);
    }
  }

  const statusText =
    status === "loading"
      ? "Backend: Loading..."
      : status === "connected"
        ? "Backend: Connected"
        : "Backend: Disconnected";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-4xl font-bold">Tindr for Games</h1>
      <p className="text-lg text-gray-600">Discover your next game.</p>
      <p className="text-base text-gray-700">{statusText}</p>
      {!authLoading &&
        (user ? (
          <div className="flex items-center gap-3">
            <span>Welcome, {user.username}</span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              {logoutLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        ) : (
          <Link href="/login" className="underline">
            Log in
          </Link>
        ))}
    </main>
  );
}
