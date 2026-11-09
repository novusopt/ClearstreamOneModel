import { BRAND } from "@/lib/brand";
import { absoluteUrl, ayahPath, SITE_URL, surahPath } from "@/lib/site";
import type { Chapter } from "@/lib/types";

/** The Qurʾān as a schema.org Book, the parent of every surah (Chapter) and ayah (Quotation). */
export const QURAN_BOOK = {
  "@type": "Book",
  "@id": `${SITE_URL}/#quran`,
  name: "The Qurʾān",
  alternateName: ["Al-Qurʾān al-Karīm", "القرآن الكريم", "Quran", "Koran"],
  inLanguage: "ar",
  numberOfPages: 604,
};

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: BRAND.name,
    alternateName: BRAND.nameArabic,
    description: BRAND.description,
    inLanguage: "en",
  };
}

type Crumb = { name: string; path: string };

export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.path) })),
  };
}

export function surahLd(chapter: Chapter) {
  return {
    "@context": "https://schema.org",
    "@type": "Chapter",
    "@id": `${absoluteUrl(surahPath(chapter.id))}#surah`,
    url: absoluteUrl(surahPath(chapter.id)),
    name: `Surah ${chapter.nameSimple}`,
    alternateName: [chapter.nameArabic, chapter.nameTranslation],
    position: chapter.id,
    inLanguage: "ar",
    ...(chapter.pages ? { pageStart: chapter.pages[0], pageEnd: chapter.pages[1] } : {}),
    isPartOf: QURAN_BOOK,
  };
}

export function ayahLd(chapter: Chapter, ayah: number, arabic: string, translation: string, name?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Quotation",
    "@id": `${absoluteUrl(ayahPath(chapter.id, ayah))}#ayah`,
    url: absoluteUrl(ayahPath(chapter.id, ayah)),
    name: `${chapter.nameSimple} ${chapter.id}:${ayah}${name ? ` (${name})` : ""}`,
    text: arabic,
    inLanguage: "ar",
    position: ayah,
    workTranslation: { "@type": "CreativeWork", inLanguage: "en", text: translation, author: { "@type": "Person", name: "Saheeh International" } },
    isPartOf: { "@type": "Chapter", "@id": `${absoluteUrl(surahPath(chapter.id))}#surah`, name: `Surah ${chapter.nameSimple}`, isPartOf: QURAN_BOOK },
  };
}

export function faqLd(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** Trim to a search-snippet length on a word boundary. */
export function snippet(text: string, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
