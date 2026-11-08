import { cx } from "@/utils/cx";

/** Eight-pointed star (rub el hizb) mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cx("size-8", className)}>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-400)" />
          <stop offset="100%" stopColor="var(--color-brand-700)" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="20" height="20" rx="3" fill="url(#logo-g)" />
      <rect x="6" y="6" width="20" height="20" rx="3" fill="url(#logo-g)" transform="rotate(45 16 16)" />
      <circle cx="16" cy="16" r="5" fill="none" stroke="var(--color-gold-300)" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-primary">
        Noor<span className="text-brand-secondary">.</span>
      </span>
    </span>
  );
}
