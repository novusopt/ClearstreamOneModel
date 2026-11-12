/*
 * The hero illustration: the niche (mishkāh) of An-Nur 24:35 — "the example of His light is like a niche
 * within which is a lamp; the lamp is within glass".
 *
 * Drawn as surfaces rather than outlines: a soft halo arch, a lit glass panel with one gilded edge, a faint
 * khātam star hood and a hanging mosque lamp. It sits below the header (never behind the menu bar) and
 * dissolves into the page towards the bottom.
 *
 * Motion ("the lamp is lit", `.kindle-*` in globals.css): on load the flame kindles, its glow opens and the
 * light falls through the panel, once; afterwards only the flame breathes (9 s), paused while the hero is
 * off screen (`data-still` on the hero section). Reduced motion shows the lit lamp, still.
 *
 * Geometry (viewBox 600 × 720, axis x = 300, springing line y = 300): each pointed arch is two circular
 * arcs centred on the springing line past the axis, r = (w² + h²) / 2w for half-width w and rise h.
 */
const AXIS = 300;
const SPRING = 300;
const BOTTOM = 720;

const n = (v: number) => Math.round(v * 100) / 100;

function arch(w: number, apex: number) {
  const h = SPRING - apex;
  const r = n((w * w + h * h) / (2 * w));
  return `M${n(AXIS - w)} ${BOTTOM} V${SPRING} A${r} ${r} 0 0 1 ${AXIS} ${apex} A${r} ${r} 0 0 1 ${n(AXIS + w)} ${SPRING} V${BOTTOM} Z`;
}

const HALO = arch(292, 0);
const PANEL = arch(268, 22);
const APEX = 22;

export function HeroNiche() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 720"
      className="pointer-events-none absolute top-[5.5rem] left-1/2 -z-10 w-[37.5rem] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 [--niche-edge:var(--color-gold-500)] [--niche-glass:var(--color-gold-100)] [--niche-halo:var(--color-brand-200)] [--niche-hood:var(--color-gold-600)] dark:[--niche-edge:var(--color-gold-300)] dark:[--niche-glass:var(--color-brand-800)] dark:[--niche-halo:var(--color-brand-700)] dark:[--niche-hood:var(--color-gold-300)]"
    >
      <defs>
        {/* Eight-pointed star (khātam) lattice, centred on the axis. */}
        <pattern id="niche-khatam" width="36" height="36" patternUnits="userSpaceOnUse" x="30" y="4">
          <g fill="none" style={{ stroke: "var(--niche-hood)" }} strokeWidth="0.7">
            <rect x="10.5" y="10.5" width="15" height="15" />
            <rect x="10.5" y="10.5" width="15" height="15" transform="rotate(45 18 18)" />
            <circle cx="18" cy="18" r="2.6" />
            <path d="M0 -5 L5 0 L0 5 L-5 0 Z M36 -5 L41 0 L36 5 L31 0 Z M0 31 L5 36 L0 41 L-5 36 Z M36 31 L41 36 L36 41 L31 36 Z" />
          </g>
        </pattern>

        {/* Everything dissolves into the page towards the bottom. */}
        <linearGradient id="niche-dissolve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" />
          <stop offset="0.45" stopColor="white" stopOpacity="0.8" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="niche-mask">
          <rect width="600" height="720" fill="url(#niche-dissolve)" />
        </mask>

        {/* The hood pattern only lives at the crown, around the lamp. */}
        <linearGradient id="niche-hood-fade" x1="0" y1="0" x2="0" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" />
          <stop offset="0.1" stopColor="white" stopOpacity="0.7" />
          <stop offset="0.24" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="niche-hood-mask">
          <rect width="600" height="720" fill="url(#niche-hood-fade)" />
        </mask>
        <clipPath id="niche-panel">
          <path d={PANEL} />
        </clipPath>

        <linearGradient id="niche-halo-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--niche-halo)", stopOpacity: 0.45 }} />
          <stop offset="0.6" style={{ stopColor: "var(--niche-halo)", stopOpacity: 0.12 }} />
          <stop offset="1" style={{ stopColor: "var(--niche-halo)", stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id="niche-glass-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--niche-glass)", stopOpacity: 0.95 }} />
          <stop offset="0.5" style={{ stopColor: "var(--niche-glass)", stopOpacity: 0.45 }} />
          <stop offset="1" style={{ stopColor: "var(--niche-glass)", stopOpacity: 0 }} />
        </linearGradient>
        <radialGradient id="niche-light" cx={AXIS} cy="110" r="300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-gold-300)" stopOpacity="0.6" />
          <stop offset="0.4" stopColor="var(--color-gold-200)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--color-gold-200)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="niche-edge-stroke" x1="0" y1="0" x2="0" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--niche-edge)", stopOpacity: 0.9 }} />
          <stop offset="0.35" style={{ stopColor: "var(--niche-edge)", stopOpacity: 0.45 }} />
          <stop offset="0.75" style={{ stopColor: "var(--niche-edge)", stopOpacity: 0 }} />
        </linearGradient>

        <radialGradient id="lamp-glow" cx="40" cy="116" r="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-gold-300)" stopOpacity="0.95" />
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

      <g mask="url(#niche-mask)">
        {/* Halo: a larger, paler arch behind the panel gives depth without a second outline. */}
        <path d={HALO} fill="url(#niche-halo-fill)" />
        {/* The lit glass panel, its star hood and its single gilded edge. */}
        <path d={PANEL} fill="url(#niche-glass-fill)" />
        <path d={PANEL} fill="url(#niche-light)" className="kindle-wash dark:opacity-70" />
        <g clipPath="url(#niche-panel)" mask="url(#niche-hood-mask)" opacity="0.35">
          <rect width="600" height="720" fill="url(#niche-khatam)" />
        </g>
        <path d={PANEL} fill="none" stroke="url(#niche-edge-stroke)" strokeWidth="1.25" />
      </g>

      {/* The lamp hangs from the apex. */}
      <g>
        <g transform={`translate(${AXIS} ${APEX}) scale(0.8) translate(-40 -40)`}>
          <circle cx="40" cy="116" r="64" fill="url(#lamp-glow)" className="kindle-halo" />
          <g fill="none" className="stroke-gold-600/70 dark:stroke-gold-300/60" strokeWidth="0.9">
            <path d="M40 40 V64" />
            <circle cx="40" cy="67" r="3" />
            <path d="M38 69.5 L25 88 M40 70 V88 M42 69.5 L55 88" />
          </g>
          <path
            d="M22 88 H58 L50 98 Q48 102 52 105 C66 111 68 128 57 136 Q51 140 45 140 L47 146 H33 L35 140 Q29 140 23 136 C12 128 14 111 28 105 Q32 102 30 98 Z"
            fill="url(#lamp-glass)"
            fillOpacity="0.94"
            className="stroke-gold-700/50 dark:stroke-gold-200/40"
            strokeWidth="0.6"
          />
          <g fill="none" className="stroke-gold-700/35 dark:stroke-gold-100/40" strokeWidth="0.6">
            <path d="M24 91 H56" />
            <path d="M26 104 Q40 109 54 104" />
            <path d="M19 118 Q40 124 61 118" />
          </g>
          <path d="M40 106 C45 112 46 120 40 126 C34 120 35 112 40 106 Z" fill="url(#lamp-flame)" className="kindle-flame" />
          <path d="M24 114 C24 108 27 106 30 105" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
