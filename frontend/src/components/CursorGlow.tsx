import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GENRES } from "../lib/genres";
import type { CSSProperties } from "react";

interface Burst {
  id: number;
  x: number;
  y: number;
  rgb: string;
}

/** A small accent-coloured confirmation at the exact pointer/touch position. */
export default function CursorGlow() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onDown = (event: PointerEvent) => {
      const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
      const hex = genre.hex.slice(1);
      const rgb = `${parseInt(hex.slice(0, 2), 16)} ${parseInt(hex.slice(2, 4), 16)} ${parseInt(hex.slice(4, 6), 16)}`;
      const burst = { id: idRef.current++, x: event.clientX, y: event.clientY, rgb };
      setBursts((current) => [...current.slice(-3), burst]);
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {bursts.map((burst) => (
        <motion.span
          key={burst.id}
          className="cursor-burst"
          style={{ left: burst.x, top: burst.y, "--burst-rgb": burst.rgb } as CSSProperties}
          initial={{ scale: 0.25, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => setBursts((current) => current.filter((item) => item.id !== burst.id))}
        />
      ))}
    </div>
  );
}
