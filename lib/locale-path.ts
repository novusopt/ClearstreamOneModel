import { isLocale, type Lang } from "@/lib/i18n";

/** The language of a pathname: its first segment when that is a locale, else English. */
export function langFromPath(pathname: string | null): Lang {
  const seg = pathname?.split("/")[1] ?? "";
  return isLocale(seg) ? seg : "en";
}

/**
 * Keep links inside the visitor's language: home and surah/ayah landing pages have localized versions;
 * reader deep links (/surah/N#v-A) open the interactive reader with that translation (?t=lang).
 * Everything else (library, review, juz, mushaf pages) is shared.
 */
export function localizeHref(lang: Lang, href: string): string {
  if (lang === "en") return href;
  const [pathAndQuery, hash = ""] = href.split("#");
  const h = hash ? `#${hash}` : "";
  if (pathAndQuery === "/" || pathAndQuery === "") return `/${lang}${h}`;
  const surah = pathAndQuery.match(/^\/surah\/(\d+)(?:\/(\d+))?$/);
  if (surah) {
    if (surah[2]) return `/${lang}${pathAndQuery}`;
    return hash ? `${pathAndQuery}?t=${lang}${h}` : `/${lang}${pathAndQuery}`;
  }
  return href;
}

/** The same page in another language (for the language switcher); falls back to that language's home. */
export function switchLanguagePath(pathname: string, target: Lang): string {
  const current = langFromPath(pathname);
  const base = current === "en" ? pathname : pathname.slice(current.length + 1) || "/";
  const localizable = base === "/" || /^\/surah\/\d+(\/\d+)?$/.test(base);
  if (!localizable) return target === "en" ? base : `/${target}`;
  if (target === "en") return base;
  return base === "/" ? `/${target}` : `/${target}${base}`;
}
