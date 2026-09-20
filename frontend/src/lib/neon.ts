/** WebGL2 renderer for the background: glowing neon rings, like lit glass bubbles.
 *  Each ring is a thin luminous rim whose colour flows along the curve (purple → pink → orange ...),
 *  brightest on one side (a crescent), with a dark glassy inside and a soft outer glow.
 *  Plus a few tiny twinkling sparks. No CSS blur anywhere. */
import { makeProgram } from "./gl";

export interface Ring {
  x: number; y: number; r: number; w: number; // CSS px, strength 0..1
  hue: number;   // 0..1 base colour
  span: number;  // 0..1 how far the hue travels around the ring (wider = more colours)
  phase: number; // offsets the colour flow
  light: number; // radians: where the crescent is brightest
}

export const MAX_RINGS = 12;

const FRAG = `#version 300 es
precision highp float;
#define MAX ${MAX_RINGS}
#define PI 3.14159265
uniform vec2 uRes; uniform float uTime; uniform int uCount; uniform float uDpr; uniform float uGain;
uniform vec4 uRing[MAX];   // x, y, radius (css px), strength
uniform vec4 uParam[MAX];  // hue, span, phase, light angle
out vec4 outColor;

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 hsl2rgb(vec3 c){
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main(){
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = frag / uRes;
  vec3 light = vec3(0.0);

  for (int i = 0; i < MAX; i++) {
    if (i >= uCount) break;
    vec4 b = uRing[i]; vec4 p = uParam[i];
    vec2 d = frag - b.xy * uDpr;
    float R = b.z * uDpr;
    float rr = length(d) / R;
    if (rr > 2.4) continue;

    float ang = atan(d.y, d.x);
    float la = p.w + uTime * 0.05;                       // the bright side turns very slowly
    float lit = 0.5 + 0.5 * cos(ang - la);               // 1 on the lit side, 0 opposite
    float lit2 = 0.5 + 0.5 * cos(ang - la - PI);         // faint reflected light opposite

    float h = fract(p.x + p.y * 0.5 * sin(ang + p.z + uTime * 0.11));   // colour flows along the rim
    vec3 rimCol = hsl2rgb(vec3(h, 1.0, 0.56));

    float dist = rr - 1.0;
    float thick = mix(0.016, 0.115, pow(lit, 1.6));      // thin at the ends, fuller in the middle: a crescent
    float strength = 0.16 + 1.55 * pow(lit, 2.0) + 0.30 * lit2 * lit2;

    float core = exp(-pow(dist / (thick * 0.32), 2.0));                  // hot thin tube line
    float tube = exp(-abs(dist) / (thick * 1.5)) * (dist < 0.0 ? 1.0 : 0.6);   // coloured light around it
    vec3 rim = rimCol * tube * strength + mix(rimCol, vec3(1.0), 0.6) * core * strength * 0.85;

    float inside = step(rr, 1.0);
    vec3 fill = rimCol * (0.035 * smoothstep(1.0, 0.0, rr) + 0.42 * pow(lit, 3.0) * exp(-(1.0 - rr) * 6.0)) * inside;
    float halo = exp(-max(dist, 0.0) * 4.5) * 0.34 * pow(lit, 1.5) * (1.0 - inside);

    // a second, fainter rim just inside, like the inner edge of a glass bubble
    float core2 = exp(-pow((rr - 0.925) / (thick * 0.28), 2.0));
    rim += hsl2rgb(vec3(fract(h + 0.08), 1.0, 0.6)) * core2 * strength * 0.32;

    light += (rim + fill + rimCol * halo) * b.w;
  }

  // a few tiny, slowly drifting sparks
  vec2 gp = frag / (110.0 * uDpr) + vec2(uTime * 0.008, -uTime * 0.005);
  vec2 id = floor(gp); vec2 f = fract(gp) - 0.5;
  float hs = hash(id);
  if (hs > 0.93) {
    vec2 o = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.6;
    float dd = length(f - o);
    float tw = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.7 + hs * 1.6) + hs * 60.0));
    vec3 sc = hsl2rgb(vec3(fract(hs * 7.3), 0.9, 0.7));
    light += sc * (smoothstep(0.022, 0.0, dd) * 0.9 + smoothstep(0.10, 0.0, dd) * 0.10) * tw;
  }

  light = 1.0 - exp(-light * 1.3);
  float m = smoothstep(0.0, 0.10, uv.x) * smoothstep(1.0, 0.90, uv.x) * smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);
  light *= m * uGain;                                   // colour dissolves as it reaches the screen edge
  light += (hash(frag + uTime) - 0.5) / 200.0;          // dither: no banding in dark gradients
  outColor = vec4(max(light, 0.0), 1.0);
}`;

export interface Neon {
  render: (rings: Ring[], time: number) => void;
  resize: () => void;
  setQuality: (q: number) => void;
  destroy: () => void;
}

export function createNeon(canvas: HTMLCanvasElement, opts: { dprCap?: number; gain?: number } = {}): Neon | null {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;
  const prog = makeProgram(gl, FRAG);
  if (!prog) return null;

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u("uRes"), uTime = u("uTime"), uCount = u("uCount"), uDpr = u("uDpr"), uGain = u("uGain");
  const uRing = u("uRing[0]"), uParam = u("uParam[0]");
  const ringData = new Float32Array(MAX_RINGS * 4), paramData = new Float32Array(MAX_RINGS * 4);
  let dpr = 1, quality = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, opts.dprCap ?? 1.5) * quality;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const render: Neon["render"] = (rings, time) => {
    const n = Math.min(rings.length, MAX_RINGS);
    for (let i = 0; i < n; i++) {
      const r = rings[i];
      ringData.set([r.x, r.y, r.r, r.w], i * 4);
      paramData.set([r.hue, r.span, r.phase, r.light], i * 4);
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform1i(uCount, n);
    gl.uniform1f(uDpr, dpr);
    gl.uniform1f(uGain, opts.gain ?? 1);
    gl.uniform4fv(uRing, ringData);
    gl.uniform4fv(uParam, paramData);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  return { render, resize, setQuality: (q) => { quality = q; resize(); }, destroy: () => { gl.deleteProgram(prog); } };
}
