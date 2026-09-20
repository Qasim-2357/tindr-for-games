import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { createNeon, type Neon, type Ring } from "../lib/neon";
import { hueOf } from "../lib/palette";

// Big neon rings that travel across the screen in slow waves and dissolve at the screen edges.
// hue = default colour (degrees). With no genre chosen every ring is a different colour and its rim
// flows through several colours. With a genre chosen the rings gather around that colour's family.
const SPEC = [
  { y: 0.30, r: 0.15, sp: 0.014, amp: 0.10, fq: 1.1, dir: 1, hue: 275, ph: 0.05, la: 3.6 },
  { y: 0.62, r: 0.19, sp: 0.011, amp: 0.10, fq: 0.9, dir: -1, hue: 20, ph: 0.30, la: 0.4 },
  { y: 0.14, r: 0.11, sp: 0.019, amp: 0.09, fq: 1.4, dir: 1, hue: 190, ph: 0.55, la: 5.4 },
  { y: 0.82, r: 0.16, sp: 0.013, amp: 0.08, fq: 1.0, dir: 1, hue: 330, ph: 0.20, la: 2.2 },
  { y: 0.48, r: 0.12, sp: 0.017, amp: 0.13, fq: 1.3, dir: 1, hue: 140, ph: 0.80, la: 1.2 },
  { y: 0.74, r: 0.10, sp: 0.021, amp: 0.11, fq: 1.6, dir: -1, hue: 225, ph: 0.42, la: 4.4 },
  { y: 0.20, r: 0.13, sp: 0.016, amp: 0.07, fq: 0.8, dir: -1, hue: 45, ph: 0.70, la: 5.9 },
  { y: 0.90, r: 0.09, sp: 0.023, amp: 0.06, fq: 1.5, dir: 1, hue: 300, ph: 0.95, la: 3.0 },
];
const DEFAULT_SPAN = 0.3;   // ~110 degrees of colour along each rim
const THEMED_SPAN = 0.16;   // stays inside one colour family

const wrap = (h: number) => ((h % 1) + 1) % 1;
const lerpHue = (a: number, b: number, k: number) => { let d = wrap(b - a); if (d > 0.5) d -= 1; return wrap(a + d * k); };

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { focus } = useTheme();
  const focusRef = useRef(focus);
  focusRef.current = focus;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const make = () => createNeon(canvas, { dprCap: 1.5, gain: 1.1 });
    const first = make();
    if (!first) { canvas.style.display = "none"; return; } // no WebGL2: the dark background stays
    let neon: Neon = first;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const specs = window.innerWidth < 640 ? SPEC.slice(0, 5) : SPEC;
    const cur = specs.map((s) => ({ hue: s.hue / 360, span: DEFAULT_SPAN }));
    let raf = 0, last = performance.now(), clock = Math.random() * 60;

    // Weak GPU? Quietly lower the render resolution until it runs smoothly (never raises it again).
    // Add ?hq to the URL to switch this off while developing.
    const adaptive = !new URLSearchParams(window.location.search).has("hq");
    let quality = 1, frames = 0, spent = 0;

    const onResize = () => neon.resize();
    window.addEventListener("resize", onResize);

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock += dt * (reduce ? 0.08 : 1);
      if (adaptive && quality > 0.5) {
        spent += dt; frames++;
        if (frames >= 45) {
          if (spent / frames > 0.03) { quality = Math.max(0.5, quality * 0.75); neon.setQuality(quality); }
          frames = 0; spent = 0;
        }
      }
      const W = window.innerWidth, H = window.innerHeight;
      const scale = Math.min(Math.max(W, H), 1500) * 0.62;
      const themeHue = hueOf(focusRef.current);
      const ease = 1 - Math.exp(-dt * 1.2);

      const rings: Ring[] = specs.map((s, i) => {
        const targetHue = themeHue === null ? s.hue / 360 : wrap((themeHue + (i - 3.5) * 9) / 360);
        const targetSpan = themeHue === null ? DEFAULT_SPAN : THEMED_SPAN;
        cur[i].hue = lerpHue(cur[i].hue, targetHue, ease);
        cur[i].span += (targetSpan - cur[i].span) * ease;

        const cycle = (s.ph + clock * s.sp) % 1;
        const nx = s.dir > 0 ? -0.12 + cycle * 1.24 : 1.12 - cycle * 1.24;
        const ny = s.y + s.amp * Math.sin(nx * s.fq * 6.283 + s.ph * 6 + clock * 0.08) + 0.015 * Math.sin(clock * 0.3 + i);
        return {
          x: nx * W, y: ny * H,
          r: Math.min(Math.max(s.r * scale, 55), 220) * (1 + 0.04 * Math.sin(clock * 0.5 + i * 2)),
          w: 0.9 + 0.1 * Math.sin(clock * 0.6 + i * 1.7), // a gentle shimmer in brightness
          hue: cur[i].hue, span: cur[i].span, phase: s.ph * 6.283, light: s.la,
        };
      });
      neon.render(rings, clock);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Phones can drop the graphics context (low memory, tab switching). Recover instead of going blank.
    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); };
    const onRestored = () => {
      const n = make();
      if (n) { neon = n; last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      neon.destroy();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[#050507]">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
