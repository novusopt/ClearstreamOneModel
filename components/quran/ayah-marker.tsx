import { toArabicNumber } from "@/lib/utils";
import { cx } from "@/utils/cx";

/** Decorative end-of-ayah ornament with the ayah number in Arabic-Indic digits. */
export function AyahMarker({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-label={`Ayah ${n}`}
      className={cx("relative mx-1 inline-flex size-[1.5em] shrink-0 items-center justify-center align-middle text-gold-600 dark:text-gold-400", className)}
    >
      <svg viewBox="0 0 40 40" aria-hidden="true" className="absolute inset-0 size-full">
        <path
          d="M20 2 L25 8 L33 7 L32 15 L38 20 L32 25 L33 33 L25 32 L20 38 L15 32 L7 33 L8 25 L2 20 L8 15 L7 7 L15 8 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      </svg>
      <span className="relative font-quran text-[0.45em] leading-none font-bold text-secondary" aria-hidden="true">
        {toArabicNumber(n)}
      </span>
    </span>
  );
}
