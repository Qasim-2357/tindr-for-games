"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState<"loading" | "connected" | "disconnected">(
    "loading",
  );

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
    </main>
  );
}
