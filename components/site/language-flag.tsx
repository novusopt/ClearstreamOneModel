import BD from "country-flag-icons/react/1x1/BD";
import CN from "country-flag-icons/react/1x1/CN";
import ES from "country-flag-icons/react/1x1/ES";
import FR from "country-flag-icons/react/1x1/FR";
import GB from "country-flag-icons/react/1x1/GB";
import ID from "country-flag-icons/react/1x1/ID";
import PK from "country-flag-icons/react/1x1/PK";
import RU from "country-flag-icons/react/1x1/RU";
import SE from "country-flag-icons/react/1x1/SE";
import TR from "country-flag-icons/react/1x1/TR";

import type { Lang } from "@/lib/i18n";
import { cx } from "@/utils/cx";

/**
 * A flag for each site language (country-flag-icons, MIT, inline SVG: crisp everywhere, unlike flag
 * emoji on Windows). Flags stand for countries, not languages, so they are always shown next to the
 * language's own name; Urdu and Bengali use the countries where they are most widely spoken.
 */
const FLAGS: Record<Lang, typeof GB> = {
  en: GB,
  fr: FR,
  es: ES,
  id: ID,
  tr: TR,
  ur: PK,
  bn: BD,
  ru: RU,
  zh: CN,
  sv: SE,
};

/** Round flag with a hairline ring, like a UUI avatar. */
export function LanguageFlag({ lang, className }: { lang: Lang; className?: string }) {
  const Flag = FLAGS[lang];
  return (
    <span aria-hidden="true" className={cx("relative inline-flex size-5 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 ring-inset dark:ring-white/15", className)}>
      <Flag className="size-full scale-[1.15]" />
    </span>
  );
}
