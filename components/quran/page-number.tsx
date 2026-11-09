import Link from "next/link";
import { toArabicNumber } from "@/lib/utils";
import { cx } from "@/utils/cx";

/** Gold flourish beside the page number: a fading rule ending in a small diamond. */
function Flourish({ flip = false }: { flip?: boolean }) {
  return (
    <span aria-hidden="true" className={cx("flex flex-1 items-center gap-1.5", flip && "flex-row-reverse")}>
      <span className={cx("h-px flex-1 from-transparent to-gold-400/70", flip ? "bg-gradient-to-l" : "bg-gradient-to-r")} />
      <span className="size-1 rotate-45 bg-gold-400/80" />
      <span className="h-px w-6 bg-gold-400/70" />
      <span className="size-1.5 rotate-45 border border-gold-500 dark:border-gold-400" />
    </span>
  );
}

/**
 * Page number at the foot of a mushaf page: Mishkah's lamp-niche arch holding the number in
 * Arabic-Indic digits, with gold flourishes either side and the Latin number beneath.
 */
export function PageNumber({ page, href }: { page: number; href?: string }) {
  const digits = toArabicNumber(page);
  return (
    <footer className="mt-4 flex items-center gap-3 px-2 sm:px-8">
      <Flourish />
      <span className="flex flex-col items-center">
        <svg viewBox="0 0 48 56" aria-hidden="true" className="h-14 w-12 overflow-visible drop-shadow-[0_1px_0_var(--color-gold-200)] dark:drop-shadow-none">
          {/* Pointed arch: outer gold line, warm fill, dashed inner arch. */}
          <path d="M4 54 V24 C4 13 13 5 24 1 C35 5 44 13 44 24 V54 Z" className="fill-gold-50 stroke-gold-500 dark:fill-brand-950 dark:stroke-gold-400" strokeWidth="1.6" />
          <path d="M9 50 V25 C9 16 16 10 24 7 C32 10 39 16 39 25 V50 Z" className="fill-none stroke-gold-400/60" strokeWidth="0.8" strokeDasharray="1.6 2" />
          <circle cx="24" cy="4.2" r="1.6" className="fill-gold-500 dark:fill-gold-400" />
          <text
            x="24"
            y="33"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={digits.length >= 3 ? 17 : 20}
            className="fill-gold-700 font-quran dark:fill-gold-200"
          >
            {digits}
          </text>
        </svg>
        {href ? (
          <Link
            href={href}
            prefetch={false}
            className="mt-1 rounded text-[10px] font-semibold tracking-[0.18em] text-quaternary uppercase tabular-nums outline-focus-ring hover:text-brand-secondary focus-visible:outline-2"
          >
            Page {page}
          </Link>
        ) : (
          <span className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-quaternary uppercase tabular-nums">Page {page}</span>
        )}
      </span>
      <Flourish flip />
    </footer>
  );
}
