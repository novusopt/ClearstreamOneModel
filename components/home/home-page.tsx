import type { Metadata } from "next";
import { BentoFeatures } from "@/components/home/bento-features";
import { ContinueReading } from "@/components/home/continue-reading";
import { Faq } from "@/components/home/faq";
import { FatihahStory } from "@/components/home/fatihah-story";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { Journey } from "@/components/home/journey";
import { Principles } from "@/components/home/principles";
import { SourcesMarquee } from "@/components/home/sources-marquee";
import { Stats } from "@/components/home/stats";
import { JuzIndex, SurahIndex } from "@/components/home/surah-index";
import { UiProvider } from "@/components/providers/ui-messages";
import { HtmlLang } from "@/components/seo/html-lang";
import { JsonLd } from "@/components/seo/json-ld";
import { type Lang, languageAlternates, localePath, ogLocale, t } from "@/lib/i18n";
import { getChapters, getSurah, getTranslation } from "@/lib/quran";
import { faqLd, websiteLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { getMessages } from "@/lib/ui-messages";

/** Home page metadata for a language (title/description from the catalogue, hreflang across all languages). */
export function homeMetadata(lang: Lang): Metadata {
  const m = getMessages(lang);
  return {
    title: { absolute: m.meta.homeTitle },
    description: m.meta.homeDescription,
    alternates: { canonical: localePath(lang, "/"), languages: languageAlternates("/") },
    openGraph: { url: localePath(lang, "/"), locale: ogLocale(lang), title: m.meta.homeTitle, description: m.meta.homeDescription },
  };
}

/** The landing page in one language: English at /, localized at /fr, /id … */
export async function HomePage({ lang }: { lang: Lang }) {
  const m = getMessages(lang);
  const s = t(lang);
  const chapters = getChapters();
  const [fatihah, baqarah, fatihahT] = await Promise.all([getSurah(1), getSurah(2), lang === "en" ? null : getTranslation(lang, 1).catch(() => null)]);
  const ayatAlKursi = baqarah.verses[254];

  return (
    <UiProvider lang={lang} messages={m} fatihah={fatihahT ?? undefined}>
      <div lang={s.code} dir={s.dir}>
        {lang !== "en" && <HtmlLang lang={s.code} />}
        <JsonLd data={[{ ...websiteLd(), inLanguage: s.code, url: absoluteUrl(localePath(lang, "/")) }, faqLd(m.faq.items.map((f) => ({ q: f.q, a: f.a })))]} />
        <Hero chapters={chapters} fatihah={fatihah.verses} />
        <SourcesMarquee />
        <BentoFeatures sample={ayatAlKursi} />
        <Journey verse={fatihah.verses[4]} />
        <FatihahStory verses={fatihah.verses} />
        <Stats />
        <div className="mx-auto max-w-7xl px-4 pt-16 md:px-8">
          <ContinueReading chapters={chapters} />
        </div>
        <SurahIndex chapters={chapters} />
        <JuzIndex chapters={chapters} />
        <Principles />
        <Faq />
        <FinalCta />
      </div>
    </UiProvider>
  );
}
