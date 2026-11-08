import { cx } from "@/utils/cx";

interface VerseNumberProps {
  surah: number;
  ayah: number;
  /** This ayah is the current one in the player. */
  active?: boolean;
  /** Audio is playing this ayah right now. */
  playing?: boolean;
}

/**
 * Header medallion for an ayah: the number set in a small rub el hizb (two layered squares),
 * with the surah:ayah reference beside it.
 */
export function VerseNumber({ surah, ayah, active = false, playing = false }: VerseNumberProps) {
  const digits = String(ayah).length;
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-11 shrink-0 place-items-center" aria-hidden="true">
        <span
          className={cx(
            "absolute inset-[8px] rounded-[4px] ring-1 transition-all duration-500",
            "group-hover/verse:rotate-45",
            active ? "bg-brand-solid ring-gold-400" : "bg-primary ring-gold-400/70 dark:bg-brand-950",
            playing && "animate-[spin_10s_linear_infinite]",
          )}
        />
        <span
          className={cx(
            "absolute inset-[8px] rotate-45 rounded-[4px] ring-1 transition-all duration-500",
            "group-hover/verse:rotate-90",
            active ? "bg-brand-solid ring-gold-400 shadow-[0_0_0_4px] shadow-gold-400/20" : "bg-primary ring-gold-400/70 dark:bg-brand-950",
          )}
        />
        <span
          className={cx(
            "relative font-display leading-none font-semibold tabular-nums transition-colors",
            digits >= 3 ? "text-xs" : "text-sm",
            active ? "text-white" : "text-gold-700 dark:text-gold-300",
          )}
        >
          {ayah}
        </span>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-quaternary uppercase">Ayah</span>
        <span className="font-display text-sm font-medium text-secondary tabular-nums">
          {surah}
          <span className="mx-0.5 text-gold-500">:</span>
          {ayah}
        </span>
      </span>
    </div>
  );
}
