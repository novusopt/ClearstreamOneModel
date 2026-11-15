"use client";

/*
 * The home hero's backdrop, "liquid light": a slow field of indigo and lantern-amber light, like molten glass,
 * behind the words. One WebGL2 fragment shader (domain-warped noise), rendered at a fraction of the CSS size (the
 * field is soft, so the browser's scaling costs nothing visible) and at 30 fps.
 *
 * - Colours are the theme's tokens (`--liquid-*` in globals.css), read from CSS, so light and dark follow the theme
 *   and switch live with it.
 * - It starts after first paint (idle callback), fades in over the CSS gradient that the same box already shows, and
 *   pauses while off screen or in a background tab. Without WebGL the CSS gradient stays; under reduced motion one
 *   still frame is drawn.
 * - A centre scrim in the shader keeps the headline on a calm ground; grain (`.hero-liquid::after`) keeps it from
 *   looking digital.
 */

import { useEffect, useRef } from "react";

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `#version 300 es
precision mediump float;
uniform vec2 R;
uniform float T;
uniform float uDark;
uniform vec3 cBase, cCool, cWarm, cHi;
out vec4 o;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = .5, s = 0.;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; }
  return s;
}
float blob(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
void main() {
  float asp = R.x / R.y;
  vec2 uv = gl_FragCoord.xy / R.y;                       // y up; x 0..asp, y 0..1
  float t = T * .045;
  // The flow: domain-warped noise that bends the composition below.
  vec2 p = uv * 1.25;
  vec2 q = vec2(fbm(p + vec2(0., t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + 3.2 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 2.8 * r);
  vec2 w = uv + (r - .5) * .55;                          // warped position
  // The composition: lantern light top right and low left, indigo on the left and across the top.
  float warm = blob(w, vec2(asp * .86 + .06 * sin(T * .03), .9), vec2(asp * .32, .42))
             + .75 * blob(w, vec2(asp * .1, .12 + .05 * cos(T * .025)), vec2(asp * .26, .3));
  float cool = blob(w, vec2(asp * .16, .78), vec2(asp * .34, .5)) + .6 * blob(w, vec2(asp * .62, 1.05), vec2(asp * .3, .3));
  vec3 col = cBase;
  col = mix(col, cCool, clamp(cool * (.55 + .7 * f), 0., 1.) * (uDark > .5 ? .95 : .8));
  col = mix(col, cWarm, clamp(warm * (.45 + .9 * f), 0., 1.) * .9);
  // Fine filaments along the flow, like light inside molten glass.
  float fil = smoothstep(.035, 0., abs(f - .56)) + .6 * smoothstep(.025, 0., abs(f - .44));
  col = mix(col, cHi, fil * clamp(warm * 1.2 + cool * .5, 0., 1.) * .5);
  // A calm ground under the words (they sit a little above the middle of the box).
  vec2 c = (gl_FragCoord.xy - .5 * R) / R.y;
  c.y -= .06;
  col = mix(col, cBase, exp(-(c.x * c.x * 3. + c.y * c.y * 7.)) * .35);
  o = vec4(col, 1.);
}`;

const TOKENS = ["--liquid-base", "--liquid-cool", "--liquid-warm", "--liquid-hi"] as const;
const UNIFORMS = ["cBase", "cCool", "cWarm", "cHi"] as const;
/** Canvas pixels per CSS pixel: the field is soft, so a low resolution looks the same and costs a fraction. */
const SCALE = 0.4;
const FPS = 30;

/** Resolves any CSS colour (rgb, oklch, color-mix…) to 0–1 RGB via a 1×1 2D canvas. */
function toRgb(css: string, probe: CanvasRenderingContext2D): [number, number, number] {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function mount(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) return () => {};
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => {};
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "R");
  const uT = gl.getUniformLocation(prog, "T");
  const uDark = gl.getUniformLocation(prog, "uDark");
  const uCol = UNIFORMS.map((n) => gl.getUniformLocation(prog, n));

  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const colours = () => {
    const style = getComputedStyle(canvas);
    TOKENS.forEach((tk, i) => gl.uniform3fv(uCol[i], toRgb(style.getPropertyValue(tk).trim(), probe)));
    gl.uniform1f(uDark, document.documentElement.classList.contains("dark-mode") ? 1 : 0);
  };
  const fit = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * SCALE));
    const h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uR, w, h);
  };

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  // Start part-way into the flow so the first frame is already composed.
  const t0 = performance.now() - 24_000;
  let raf = 0;
  let last = 0;
  let visible = true;
  const frame = (now: number) => {
    gl.uniform1f(uT, reduce.matches ? 24 : (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!canvas.dataset.ready) canvas.dataset.ready = "";
  };
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (now - last < 1000 / FPS - 2) return;
    last = now;
    frame(now);
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (reduce.matches) frame(performance.now());
    else if (visible && !document.hidden) raf = requestAnimationFrame(tick);
  };

  colours();
  fit();
  frame(performance.now());
  sync();

  const ro = new ResizeObserver(() => {
    fit();
    frame(performance.now());
  });
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    sync();
  });
  io.observe(canvas);
  const mo = new MutationObserver(() => {
    colours();
    frame(performance.now());
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", sync);
  reduce.addEventListener("change", sync);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    mo.disconnect();
    document.removeEventListener("visibilitychange", sync);
    reduce.removeEventListener("change", sync);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

export function HeroLiquid() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cleanup = () => {};
    const start = () => {
      cleanup = mount(canvas);
    };
    // After first paint, so the shader compile never competes with the headline (LCP) or input.
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 1200 });
      return () => {
        cancelIdleCallback(id);
        cleanup();
      };
    }
    const id = setTimeout(start, 200);
    return () => {
      clearTimeout(id);
      cleanup();
    };
  }, []);

  return (
    <div aria-hidden="true" className="hero-liquid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(100svh,60rem)] min-h-[44rem] overflow-hidden">
      <canvas ref={ref} className="size-full opacity-0 transition-opacity duration-[1600ms] ease-out data-ready:opacity-100" />
    </div>
  );
}
