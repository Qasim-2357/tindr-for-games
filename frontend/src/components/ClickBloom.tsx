import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { createBloom, MAX_BLOOMS, type Bloom, type BloomRenderer } from "../lib/bloom";
import { BLOOM_COLORS, hsl, hueOf, type RGB } from "../lib/palette";

interface Live extends Bloom { age: number; life: number }

/** Touch or click: a glowing orb of light blooms under your finger and dissolves into smoke.
 *  Hold and drag to paint a short trail of smaller ones. The colour changes every time. */
export default function ClickBloom() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { focus } = useTheme();
  const focusRef = useRef(focus);
  focusRef.current = focus;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current!;
    const first = createBloom(canvas);
    if (!first) { canvas.style.display = "none"; return; }
    let renderer: BloomRenderer = first;

    let live: Live[] = [];
    let raf = 0, last = 0, lastColor = -1;
    let pressed = false, trailX = 0, trailY = 0;

    const onResize = () => renderer.resize();
    window.addEventListener("resize", onResize);

    const pickColor = (): RGB => {
      const hue = hueOf(focusRef.current);
      if (hue !== null && Math.random() < 0.5) return hsl(hue + (Math.random() - 0.5) * 40, 1, 0.55); // lean toward the user's colour
      let i = Math.floor(Math.random() * BLOOM_COLORS.length);
      if (i === lastColor) i = (i + 1) % BLOOM_COLORS.length; // never the same colour twice in a row
      lastColor = i;
      return BLOOM_COLORS[i];
    };

    const spawn = (x: number, y: number, scale: number, life: number) => {
      const base = window.innerWidth < 640 ? 88 : 120;
      live.push({ x, y, r: (base + Math.random() * 34) * scale, k: 0, age: 0, life, rgb: pickColor(), seed: Math.random() });
      if (live.length > MAX_BLOOMS) live.shift();
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      live.forEach((b) => { b.age += dt; b.k = Math.min(b.age / b.life, 1); });
      live = live.filter((b) => b.age < b.life);
      if (!live.length) { renderer.render([]); raf = 0; return; }

      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      live.forEach((b) => {
        const pad = b.r * 1.7;
        x0 = Math.min(x0, b.x - pad); y0 = Math.min(y0, b.y - pad); x1 = Math.max(x1, b.x + pad); y1 = Math.max(y1, b.y + pad);
      });
      renderer.render(live, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      raf = requestAnimationFrame(tick);
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pressed = true; trailX = e.clientX; trailY = e.clientY;
      spawn(e.clientX, e.clientY, 1, 1.7);
    };
    const move = (e: PointerEvent) => {
      if (!pressed) return;
      if (Math.hypot(e.clientX - trailX, e.clientY - trailY) > 64) {
        trailX = e.clientX; trailY = e.clientY;
        spawn(e.clientX, e.clientY, 0.55, 1.2);
      }
    };
    const up = () => { pressed = false; };

    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; live = []; };
    const onRestored = () => { const r = createBloom(canvas); if (r) renderer = r; };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      renderer.destroy();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[100] h-full w-full" />;
}
