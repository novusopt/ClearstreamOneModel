"use client";

import { type MotionValue, m } from "motion/react";

/*
 * The hero illustration: the niche (mishkāh) of An-Nūr 24:35 — "the example of His light is like a niche
 * within which is a lamp; the lamp is within glass". A carved pointed arch (layered mouldings, a pearl
 * band and a cusped inner edge, as on mihrab niches) with a khātam star-pattern hood, a rosette at the
 * apex and a hanging mosque lamp. The frame is gilded at the apex and fades out towards the page below.
 *
 * Geometry (viewBox 400 × 520, axis x = 200, springing line y = 220): an arch at offset `o` from the outer
 * edge has half-width w = 160 − o and apex y = 8 + 1.25·o. Each half is a circular arc centred on the
 * springing line past the axis (r = (w² + h²) / 2w), which is what makes it pointed.
 */
const AXIS = 200;
const SPRING = 220;
const BOTTOM = 520;

function archGeometry(o: number) {
  const w = 160 - o;
  const apex = 8 + 1.25 * o;
  const h = SPRING - apex;
  const r = (w * w + h * h) / (2 * w);
  return { w, apex, r };
}

const n = (v: number) => Math.round(v * 100) / 100;

/** Open arch path (both jambs + both arcs), or closed when `close`. */
function arch(o: number, close = false) {
  const { w, apex, r } = archGeometry(o);
  return `M${n(AXIS - w)} ${BOTTOM} V${SPRING} A${n(r)} ${n(r)} 0 0 1 ${AXIS} ${n(apex)} A${n(r)} ${n(r)} 0 0 1 ${n(AXIS + w)} ${SPRING} V${BOTTOM}${close ? " Z" : ""}`;
}

/** Arch whose curved part is a run of small lobes (a cusped / polylobed intrados). */
function cuspedArch(o: number, lobes: number) {
  const { w, apex, r } = archGeometry(o);
  const cx = AXIS - w + r; // centre of the left arc
  const end = Math.atan2(apex - SPRING, AXIS - cx); // angle of the apex seen from that centre
  const left = Array.from({ length: lobes + 1 }, (_, i) => {
    const t = -Math.PI + ((end + Math.PI) * i) / lobes;
    return [cx + r * Math.cos(t), SPRING + r * Math.sin(t)] as const;
  });
  const right = [...left].reverse().map(([x, y]) => [2 * AXIS - x, y] as const);
  const pts = [...left, ...right.slice(1)];
  let d = `M${n(AXIS - w)} ${BOTTOM} V${SPRING}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const lobe = Math.hypot(x1 - x0, y1 - y0) * 0.78;
    d += ` A${n(lobe)} ${n(lobe)} 0 0 1 ${n(x1)} ${n(y1)}`;
  }
  return `${d} V${BOTTOM} Z`;
}

const OUTER = arch(0, true);
const INNER = cuspedArch(28, 9);
const RULE_OUT = arch(-5);
const RULE_MAIN = arch(0);
const PEARLS = arch(7.5);
const RULE_IN = arch(15);

/** Eight-pointed rosette at the apex, from which the lamp hangs. */
const ROSETTE = "M200 0.5 L202.6 4.4 L207.2 3.5 L206.3 8.1 L210.2 10.7 L206.3 13.3 L207.2 17.9 L202.6 17 L200 20.9 L197.4 17 L192.8 17.9 L193.7 13.3 L189.8 10.7 L193.7 8.1 L192.8 3.5 L197.4 4.4 Z";

export function HeroNiche({ scale }: { scale: MotionValue<number> }) {
  return (
    <m.svg
      aria-hidden="true"
      viewBox="0 0 400 520"
      style={{ scale }}
      className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[52rem] origin-top -translate-x-1/2 overflow-visible text-brand-600/30 [--niche-gild:var(--color-gold-500)] [--niche-ink:var(--color-brand-500)] dark:text-brand-300/20 dark:[--niche-gild:var(--color-gold-300)] dark:[--niche-ink:var(--color-brand-300)]"
    >
      <defs>
        {/* Eight-pointed star (khātam) lattice with small diamonds where the tiles meet. */}
        <pattern id="niche-khatam" width="32" height="32" patternUnits="userSpaceOnUse" x="8" y="0">
          <g fill="none" stroke="currentColor" strokeWidth="0.6">
            <rect x="9" y="9" width="14" height="14" />
            <rect x="9" y="9" width="14" height="14" transform="rotate(45 16 16)" />
            <circle cx="16" cy="16" r="2.4" />
            <path d="M0 -5 L5 0 L0 5 L-5 0 Z M32 -5 L37 0 L32 5 L27 0 Z M0 27 L5 32 L0 37 L-5 32 Z M32 27 L37 32 L32 37 L27 32 Z" />
            <path d="M23 16 H27 M5 16 H9 M16 5 V9 M16 23 V27" />
          </g>
        </pattern>
        <linearGradient id="niche-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="0.08" stopColor="white" stopOpacity="0.9" />
          <stop offset="0.22" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="niche-hood">
          <rect width="400" height="520" fill="url(#niche-fade)" />
        </mask>
        <clipPath id="niche-inner">
          <path d={INNER} />
        </clipPath>
        {/* Lantern light pooling in the niche. */}
        <radialGradient id="niche-light" cx="200" cy="96" r="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-gold-300)" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="var(--color-gold-200)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--color-gold-200)" stopOpacity="0" />
        </radialGradient>
        {/* Mouldings: gilded at the crown, indigo on the jambs, gone before the page below. */}
        <linearGradient id="niche-line" x1="0" y1="0" x2="0" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--niche-gild)", stopOpacity: 0.95 }} />
          <stop offset="0.3" style={{ stopColor: "var(--niche-gild)", stopOpacity: 0.55 }} />
          <stop offset="0.5" style={{ stopColor: "var(--niche-ink)", stopOpacity: 0.4 }} />
          <stop offset="0.9" style={{ stopColor: "var(--niche-ink)", stopOpacity: 0 }} />
        </linearGradient>
        {/* The carved band between the outer moulding and the cusped edge. */}
        <linearGradient id="niche-band" x1="0" y1="0" x2="0" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--niche-gild)", stopOpacity: 0.22 }} />
          <stop offset="0.35" style={{ stopColor: "var(--niche-ink)", stopOpacity: 0.08 }} />
          <stop offset="0.85" style={{ stopColor: "var(--niche-ink)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* Glass of the niche: warm light, then the star hood on top of it. */}
      <path d={INNER} fill="url(#niche-light)" className="dark:opacity-60" />
      <g clipPath="url(#niche-inner)" mask="url(#niche-hood)">
        <rect width="400" height="520" fill="url(#niche-khatam)" />
      </g>

      {/* Frame: a tinted carved band, then layered mouldings of different weights. */}
      <path d={`${OUTER} ${INNER}`} fillRule="evenodd" fill="url(#niche-band)" />
      <g fill="none" stroke="url(#niche-line)" strokeLinejoin="round">
        <path d={RULE_OUT} strokeWidth="0.35" />
        <path d={RULE_MAIN} strokeWidth="1" />
        <path d={PEARLS} strokeWidth="2.1" strokeDasharray="0 5.2" strokeLinecap="round" />
        <path d={RULE_IN} strokeWidth="0.45" />
        <path d={INNER} strokeWidth="0.8" />
      </g>
      <path d={ROSETTE} style={{ fill: "var(--niche-gild)" }} fillOpacity="0.9" />
      <circle cx="200" cy="10.7" r="2.6" className="fill-bg-primary" />
    </m.svg>
  );
}

/** The lamp hanging in the niche: chains from the apex, a glass mosque lamp and a flame. */
export function HeroLamp() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/2 -z-10 hidden -translate-x-1/2 sm:block">
      <div className="animate-sway origin-top">
        <svg viewBox="0 0 80 150" className="h-[9.5rem] w-auto overflow-visible">
          <defs>
            <radialGradient id="lamp-glow" cx="40" cy="112" r="60" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--color-gold-300)" stopOpacity="0.9" />
              <stop offset="0.35" stopColor="var(--color-gold-400)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--color-gold-400)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="lamp-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--color-gold-200)" />
              <stop offset="0.55" stopColor="var(--color-gold-400)" />
              <stop offset="1" stopColor="var(--color-gold-600)" />
            </linearGradient>
            <radialGradient id="lamp-flame" cx="40" cy="116" r="9" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="white" />
              <stop offset="0.5" stopColor="var(--color-gold-100)" />
              <stop offset="1" stopColor="var(--color-gold-300)" />
            </radialGradient>
          </defs>

          <circle cx="40" cy="112" r="60" fill="url(#lamp-glow)" className="animate-flicker origin-[40px_112px]" />

          {/* Chain: one line from the apex, a ring, then three lines to the rim. */}
          <g fill="none" className="stroke-gold-600/70 dark:stroke-gold-300/60" strokeWidth="0.8">
            <path d="M40 32 V64" strokeDasharray="2.5 1.5" />
            <circle cx="40" cy="67" r="3" />
            <path d="M38 69.5 L25 88 M40 70 V88 M42 69.5 L55 88" />
          </g>

          {/* Mosque lamp: flared rim, narrow neck, round body, small foot. */}
          <path
            d="M22 88 H58 L50 98 Q48 102 52 105 C66 111 68 128 57 136 Q51 140 45 140 L47 146 H33 L35 140 Q29 140 23 136 C12 128 14 111 28 105 Q32 102 30 98 Z"
            fill="url(#lamp-glass)"
            fillOpacity="0.92"
            className="stroke-gold-700/50 dark:stroke-gold-200/40"
            strokeWidth="0.6"
          />
          {/* Banding on the glass, as on enamelled lamps. */}
          <g fill="none" className="stroke-gold-700/35 dark:stroke-gold-100/40" strokeWidth="0.6">
            <path d="M24 91 H56" />
            <path d="M19 118 Q40 124 61 118" />
            <path d="M26 104 Q40 109 54 104" />
          </g>
          <path d="M40 106 C45 112 46 120 40 126 C34 120 35 112 40 106 Z" fill="url(#lamp-flame)" className="animate-flicker origin-[40px_126px]" />
          {/* Highlight on the glass. */}
          <path d="M24 114 C24 108 27 106 30 105" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
