import { toArabicNumber } from "@/lib/utils";
import { cx } from "@/utils/cx";

/**
 * End-of-ayah ornament: an eight-point star (two rounded squares, outlined as one shape)
 * holding the ayah number in Arabic-Indic digits.
 *
 * The numeral is drawn inside the SVG and centred on the star's geometry, so it stays
 * centred regardless of the Arabic font's baseline metrics. Size is relative to the
 * surrounding Arabic (1.2em). Only the star turns on hover / during recitation; the
 * numeral stays upright.
 */
export function AyahMarker({ n, className, active = false }: { n: number; className?: string; active?: boolean }) {
  const square = { x: 9.5, y: 9.5, width: 29, height: 29, rx: 2.5 };
  const digits = toArabicNumber(n);
  // Arabic-Indic digits sit a little below the em-box centre in Amiri Quran; nudge them up.
  const fontSize = digits.length >= 3 ? 14 : digits.length === 2 ? 17.5 : 21;
  return (
    <span role="img" aria-label={`End of ayah ${n}`} className={cx("mx-1 inline-block size-[1.2em] shrink-0 align-middle", className)}>
      <svg viewBox="0 0 48 48" aria-hidden="true" className="block size-full overflow-visible">
        <g
          className={cx(
            "origin-center transition-transform duration-700 ease-out [transform-box:view-box]",
            "group-hover/verse:rotate-45 group-hover/ayah:rotate-45",
            active && "animate-[spin_14s_linear_infinite] drop-shadow-[0_0_5px_var(--color-gold-400)]",
          )}
        >
          {/* Outline first (wide strokes), fills on top: only the star's outer edge stays visible. */}
          <g className="stroke-gold-500 dark:stroke-gold-400" strokeWidth="3" fill="none">
            <rect {...square} />
            <rect {...square} transform="rotate(45 24 24)" />
          </g>
          <g className={cx(active ? "fill-gold-200 dark:fill-gold-600/40" : "fill-gold-50 dark:fill-brand-950")}>
            <rect {...square} />
            <rect {...square} transform="rotate(45 24 24)" />
          </g>
          <circle cx="24" cy="24" r="11" className="fill-none stroke-gold-400/60" strokeWidth="1" />
        </g>
        <text
          x="24"
          y="24"
          dy={-fontSize * 0.08}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          className="fill-gold-700 stroke-gold-700 font-quran dark:fill-gold-300 dark:stroke-gold-300"
          strokeWidth={0.4}
        >
          {digits}
        </text>
      </svg>
    </span>
  );
}
