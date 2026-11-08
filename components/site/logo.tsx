import { BRAND } from "@/lib/brand";
import { cx } from "@/utils/cx";

/**
 * Mishkah mark: a lamp glowing inside a pointed-arch niche (the "mishkāh" of Āyat an-Nūr).
 */
export function LogoMark({ className, glow = false }: { className?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cx("size-9", className)}>
      <defs>
        <linearGradient id="mk-niche" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-500)" />
          <stop offset="100%" stopColor="var(--color-brand-800)" />
        </linearGradient>
        <radialGradient id="mk-light" cx="0.5" cy="0.55" r="0.5">
          <stop offset="0%" stopColor="var(--color-gold-300)" />
          <stop offset="60%" stopColor="var(--color-gold-500)" />
          <stop offset="100%" stopColor="var(--color-gold-600)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* niche: pointed arch */}
      <path d="M6 38 V18 C6 10 13 4.5 20 2 C27 4.5 34 10 34 18 V38 Z" fill="url(#mk-niche)" />
      <path d="M10 38 V19 C10 13 15 8.5 20 6.5 C25 8.5 30 13 30 19 V38" fill="none" stroke="var(--color-gold-300)" strokeOpacity="0.35" strokeWidth="1" />
      {/* light */}
      <circle cx="20" cy="24" r="9" fill="url(#mk-light)" className={glow ? "origin-center animate-flicker" : undefined} />
      {/* lamp glass */}
      <path d="M16.5 20.5 C16.5 18 18 16.5 20 16.5 C22 16.5 23.5 18 23.5 20.5 C23.5 24 22 27.5 20 28.5 C18 27.5 16.5 24 16.5 20.5 Z" fill="var(--color-gold-300)" fillOpacity="0.9" />
      <path d="M17 31 H23 M18.5 28.5 H21.5" stroke="var(--color-gold-400)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M20 12.5 V16.5" stroke="var(--color-gold-400)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      <LogoMark glow />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-medium tracking-tight text-primary">{BRAND.name}</span>
        <span lang="ar" className="mt-0.5 font-quran text-sm leading-none text-gold-600 dark:text-gold-400">
          {BRAND.nameArabic}
        </span>
      </span>
    </span>
  );
}
