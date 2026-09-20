/** WebGL2 renderer for the touch effect (inspired by kabam.com): a big glowing orb with a white-hot centre,
 *  a saturated colour body, a darker halo, and a mottled, smoky edge that erodes as it fades away. */
import { makeProgram } from "./gl";

export interface Bloom { x: number; y: number; r: number; k: number; rgb: [number, number, number]; seed: number } // k: progress 0..1

export const MAX_BLOOMS = 12;

const FRAG = `#version 300 es
precision highp float;
#define MAX ${MAX_BLOOMS}
uniform vec2 uRes; uniform int uCount; uniform float uDpr;
uniform vec4 uB[MAX];    // x, y, radius (css px), progress
uniform vec4 uC[MAX];    // colour rgb, seed
out vec4 outColor;

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }

void main(){
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 acc = vec3(0.0);

  for (int i = 0; i < MAX; i++) {
    if (i >= uCount) break;
    vec4 b = uB[i]; vec4 c = uC[i];
    vec2 d = (frag - b.xy * uDpr) / (b.z * uDpr);
    float r = length(d);
    if (r > 2.0) continue;
    float k = b.w;

    float grow = 1.0 - pow(1.0 - min(k / 0.22, 1.0), 3.0);         // blooms open fast
    float Rs = mix(0.3, 1.0, grow) * (1.0 + 0.10 * k);
    float n = fbm(d * 2.4 + c.w * 10.0 + vec2(0.0, -k * 0.7));     // smoke that slowly rises
    float erode = smoothstep(0.25, 1.0, k);                        // the edge breaks up over time

    float base = 1.0 - r / Rs;                                     // 1 in the centre, 0 at the rim
    float v = base * 1.25 + (n - 0.5) * 0.95 * (0.3 + 0.7 * erode) - erode * 0.8;
    float I = smoothstep(0.0, 0.9, v);
    float fade = (1.0 - smoothstep(0.6, 1.0, k)) * clamp(k / 0.03, 0.0, 1.0);

    float hot = smoothstep(0.62, 1.0, base + (n - 0.5) * 0.35) * (1.0 - erode * 0.9);   // small white-hot centre
    vec3 body = mix(c.rgb * 1.05, mix(c.rgb, vec3(1.0), 0.9), hot);           // saturated colour body
    float halo = exp(-r * 2.3 / Rs) * 0.38 * (1.0 - erode * 0.5);  // darker coloured glow around it

    acc += (body * I + c.rgb * halo) * fade;
  }

  acc = 1.0 - exp(-acc * 1.15);
  float a = clamp(max(acc.r, max(acc.g, acc.b)), 0.0, 1.0);
  outColor = vec4(acc, a);                                          // premultiplied
}`;

export interface BloomRenderer {
  render: (blooms: Bloom[], scissor?: { x: number; y: number; w: number; h: number }) => void;
  resize: () => void;
  destroy: () => void;
}

export function createBloom(canvas: HTMLCanvasElement, dprCap = 1.5): BloomRenderer | null {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;
  const prog = makeProgram(gl, FRAG);
  if (!prog) return null;

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u("uRes"), uCount = u("uCount"), uDpr = u("uDpr"), uB = u("uB[0]"), uC = u("uC[0]");
  const bData = new Float32Array(MAX_BLOOMS * 4), cData = new Float32Array(MAX_BLOOMS * 4);
  let dpr = 1, cssH = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    cssH = window.innerHeight;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(cssH * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const render: BloomRenderer["render"] = (blooms, scissor) => {
    const n = Math.min(blooms.length, MAX_BLOOMS);
    for (let i = 0; i < n; i++) {
      const b = blooms[i];
      bData.set([b.x, b.y, b.r, b.k], i * 4);
      cData.set([...b.rgb, b.seed], i * 4);
    }
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (n === 0) return;
    if (scissor) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(Math.max(0, scissor.x * dpr), Math.max(0, (cssH - scissor.y - scissor.h) * dpr), scissor.w * dpr, scissor.h * dpr);
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1i(uCount, n);
    gl.uniform1f(uDpr, dpr);
    gl.uniform4fv(uB, bData);
    gl.uniform4fv(uC, cData);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  return { render, resize, destroy: () => { gl.deleteProgram(prog); } };
}
