/*
 * The hero's background waves: two translucent ribbons of thin lines, like light (or the sound of the
 * recitation) moving through the niche. Gold drifts one way, indigo the other, slowly.
 *
 * Each ribbon is one periodic wave (two sines whose periods divide the 1440-unit tile), drawn once in
 * <defs> and reused by <use> with small x/y offsets, so the markup stays tiny. The SVG is two tiles wide
 * and drifts by exactly one tile (`.wave-drift-*` in globals.css: transform only, on the compositor), so
 * the loop is seamless. It pauses while the hero is off screen ([data-still]) and is still under reduced
 * motion. Server-rendered, no JavaScript.
 */

const TILE = 1440;
const HEIGHT = 220;
const STEP = 60;

const r = (v: number) => Math.round(v * 10) / 10;

/** A smooth path through y(x) from -TILE to 3 * TILE (Catmull-Rom → cubic Bézier). */
function wavePath(y: (x: number) => number) {
  const pts: [number, number][] = [];
  for (let x = -TILE; x <= 3 * TILE; x += STEP) pts.push([x, y(x)]);
  let d = `M${pts[0][0]} ${r(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(0, i - 1)];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${r(x1 + (x2 - x0) / 6)} ${r(y1 + (y2 - y0) / 6)} ${r(x2 - (x3 - x1) / 6)} ${r(y2 - (y3 - y1) / 6)} ${x2} ${r(y2)}`;
  }
  return d;
}

const TAU = Math.PI * 2;
// Periods 720 and 480 (and 1440, 360) divide the tile, so every wave repeats exactly once per tile.
const GOLD = wavePath((x) => 34 * Math.sin((TAU * x) / 720) + 22 * Math.sin((TAU * x) / 480 + 1.1));
const INDIGO = wavePath((x) => 26 * Math.sin((TAU * x) / 1440 + 0.6) + 18 * Math.sin((TAU * x) / 360 + 2.3));

/** Line offsets across a ribbon; the middle lines are the brightest. */
const LINES = Array.from({ length: 11 }, (_, i) => ({ dx: i * 16, dy: (i - 5) * 4.5, o: 0.25 + 0.75 * Math.sin((Math.PI * i) / 10) }));

function Ribbon({ id, d, y, className, stroke }: { id: string; d: string; y: number; className: string; stroke: string }) {
  return (
    // Two tiles wide, and at least 2 × 1200 px so phones see long, gentle waves rather than squeezed ones.
    <div className={`absolute inset-y-0 left-0 w-[max(200%,2400px)] ${className}`}>
      <svg viewBox={`0 0 ${TILE * 2} ${HEIGHT}`} preserveAspectRatio="none" className="size-full overflow-visible">
        <defs>
          <path id={id} d={d} />
        </defs>
        <g fill="none" style={{ stroke }} strokeWidth="1.1" vectorEffect="non-scaling-stroke">
          {LINES.map((l, i) => (
            <use key={i} href={`#${id}`} x={l.dx} y={y + l.dy} strokeOpacity={l.o} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function HeroWaves() {
  return (
    <div
      aria-hidden="true"
      className="hero-waves pointer-events-none absolute inset-x-0 top-[18rem] -z-10 h-[15rem] overflow-hidden opacity-55 sm:opacity-70 md:top-[20rem] md:h-[17rem] dark:opacity-80"
    >
      <Ribbon id="wave-gold" d={GOLD} y={HEIGHT * 0.38} className="wave-drift-a" stroke="color-mix(in srgb, var(--color-gold-400) 70%, transparent)" />
      <Ribbon id="wave-indigo" d={INDIGO} y={HEIGHT * 0.66} className="wave-drift-b" stroke="color-mix(in srgb, var(--color-brand-400) 55%, transparent)" />
    </div>
  );
}
