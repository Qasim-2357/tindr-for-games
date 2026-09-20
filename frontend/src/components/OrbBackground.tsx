import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { GENRES, hexToRgb } from "../lib/genres";

interface Orb {
  bx: number; by: number;        // home position (0..1 of viewport)
  ax: number; ay: number;        // drift amplitude (0..1)
  sx: number; sy: number;        // drift speed (rad/s)
  px: number; py: number; pp: number; // phases
  r: number;                     // radius as fraction of the longest screen side
  depth: number;                 // 0.4 (far) .. 1 (near) -> parallax + brightness
  rgb: [number, number, number]; // current colour (lerped)
  alpha: number;                 // current strength (lerped)
}

// Discrete luminous sources keep the black environment alive without becoming a gradient.
const LAYOUT = [
  { bx: 0.06, by: 0.2, r: 0.052, depth: 0.8 },
  { bx: 0.93, by: 0.2, r: 0.044, depth: 0.62 },
  { bx: 0.92, by: 0.78, r: 0.058, depth: 0.72 },
  { bx: 0.07, by: 0.78, r: 0.04, depth: 0.54 },
  { bx: 0.97, by: 0.5, r: 0.032, depth: 0.48 },
  { bx: 0.33, by: 0.06, r: 0.028, depth: 0.42 },
  { bx: 0.58, by: 0.94, r: 0.035, depth: 0.5 },
];

/** Which colour + strength each orb should be. */
function targets(focus: string | null) {
  const palette = GENRES.map((g) => hexToRgb(g.hex));
  return LAYOUT.map((_, i) => {
    if (!focus) return { rgb: palette[i % palette.length], alpha: 0.62 };
    // Themed: the user's colour leads, with quiet echoes of the others far away.
    const main = hexToRgb(focus);
    return i < 4 ? { rgb: main, alpha: 0.6 - i * 0.06 } : { rgb: palette[(i * 2) % palette.length], alpha: 0.3 };
  });
}

export default function OrbBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { focus } = useTheme();
  const focusRef = useRef(focus);
  focusRef.current = focus;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SCALE = 0.5; // half-resolution: soft light doesn't need pixels, and it's much cheaper
    let w = 0, h = 0, raf = 0;
    const start = targets(focusRef.current);
    const orbs: Orb[] = LAYOUT.map((l, i) => ({
      ...l,
      ax: 0.025 + Math.random() * 0.045, ay: 0.025 + Math.random() * 0.045,
      sx: 0.035 + Math.random() * 0.045, sy: 0.03 + Math.random() * 0.05,
      px: Math.random() * 6.28, py: Math.random() * 6.28, pp: Math.random() * 6.28,
      rgb: [...start[i].rgb] as [number, number, number],
      alpha: start[i].alpha,
    }));

    const resize = () => {
      w = Math.ceil(window.innerWidth * SCALE);
      h = Math.ceil(window.innerHeight * SCALE);
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      const tg = targets(focusRef.current);
      const ease = 1 - Math.exp(-dt * 1.6); // smooth colour transitions (~1s)
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const big = Math.max(w, h);
      orbs.forEach((o, i) => {
        for (let k = 0; k < 3; k++) o.rgb[k] += (tg[i].rgb[k] - o.rgb[k]) * ease;
        o.alpha += (tg[i].alpha - o.alpha) * ease;

        const m = reduce ? 0 : 1;
        const x = (o.bx + Math.sin(t * o.sx + o.px) * o.ax * m) * w;
        const y = (o.by + Math.cos(t * o.sy + o.py) * o.ay * m) * h;
        const r = o.r * big * (1 + Math.sin(t * 0.25 + o.pp) * 0.06 * m);
        // Slow breathing: each orb glows and dims on its own rhythm.
        const a = o.alpha * o.depth * (0.72 + 0.28 * Math.sin(t * 0.35 + o.pp) * m);
        const c = `${o.rgb[0] | 0},${o.rgb[1] | 0},${o.rgb[2] | 0}`;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,255,255,${Math.min(a * 1.35, 0.92)})`);
        g.addColorStop(0.018, `rgba(${c},${Math.min(a * 1.15, 0.78)})`);
        g.addColorStop(0.09, `rgba(${c},${a * 0.9})`);
        g.addColorStop(0.3, `rgba(${c},${a * 0.46})`);
        g.addColorStop(0.58, `rgba(${c},${a * 0.16})`);
        g.addColorStop(0.82, `rgba(${c},${a * 0.035})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-black">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="grain" />
    </div>
  );
}
