import Link from "next/link";
import { ALL_LANGUAGES, type Lang, localePath, t } from "@/lib/i18n";
import { cx } from "@/utils/cx";

/** "Other languages" switcher for pages that exist in every translation language (hreflang-linked). */
export function LanguageLinks({ current, path, className }: { current: Lang; path: string; className?: string }) {
  return (
    <nav aria-label={t(current).otherLanguages} className={cx("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm font-medium text-tertiary">{t(current).otherLanguages}:</span>
      {ALL_LANGUAGES.map((l) =>
        l.id === current ? (
          <span key={l.id} aria-current="true" className="rounded-full bg-brand-solid px-3 py-1 text-sm font-medium text-white">
            {l.native}
          </span>
        ) : (
          <Link
            key={l.id}
            href={localePath(l.id, path)}
            hrefLang={l.code}
            lang={l.code}
            prefetch={false}
            className="rounded-full px-3 py-1 text-sm font-medium text-secondary ring-1 ring-secondary outline-focus-ring transition ring-inset hover:bg-secondary hover:text-primary focus-visible:outline-2"
          >
            {l.native}
          </Link>
        ),
      )}
    </nav>
  );
}
