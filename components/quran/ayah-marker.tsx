import { toArabicNumber } from "@/lib/utils";
import { cx } from "@/utils/cx";

/**
 * End-of-ayah ornament: an eight-point star (two rounded squares, outlined as one shape)
 * holding the ayah number in Arabic-Indic digits. It turns a little on hover and slowly
 * while its ayah is being recited.
 */
export function AyahMarker({ n, className, active = false }: { n: number; className?: string; active?: boolean }) {
  const square = { x: 9.5, y: 9.5, width: 29, height: 29, rx: 2.5 };
  return (
    <span
      role="img"
      aria-label={`End of ayah ${n}`}
      className={cx("relative mx-1.5 inline-grid size-[1.65em] shrink-0 place-items-center align-middle", className)}
    >
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className={cx(
          "absolute inset-0 size-full overflow-visible transition-transform duration-700 ease-out",
          "group-hover/verse:rotate-45 group-hover/ayah:rotate-45",
          active && "animate-[spin_14s_linear_infinite] drop-shadow-[0_0_6px_var(--color-gold-400)]",
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
        <circle cx="24" cy="24" r="10.5" className="fill-none stroke-gold-400/60" strokeWidth="1" />
      </svg>
      <span aria-hidden="true" className="relative font-quran text-[0.5em] leading-none font-bold text-gold-700 dark:text-gold-300">
        {toArabicNumber(n)}
      </span>
    </span>
  );
}
