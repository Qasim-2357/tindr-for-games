export type RGB = [number, number, number]; // 0..1

export function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, l];
}

export function hsl(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
}

/** The hue (0..360) of a genre colour, or null when no genre is chosen. */
export const hueOf = (hex: string | null) => (hex ? hexToHsl(hex)[0] : null);

/** Vivid touch colours (Kabam-style): cyan, pink, blue, orange, purple, green, gold. */
export const BLOOM_COLORS: RGB[] = [
  [0.10, 0.90, 1.00], [1.00, 0.25, 0.65], [0.20, 0.30, 1.00], [1.00, 0.50, 0.10],
  [0.65, 0.30, 1.00], [0.15, 0.95, 0.55], [1.00, 0.80, 0.15],
];
