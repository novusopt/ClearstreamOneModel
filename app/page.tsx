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
import { JsonLd } from "@/components/seo/json-ld";
import { FAQS } from "@/lib/faq";
import { getChapters, getSurah } from "@/lib/quran";
import { faqLd, websiteLd } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default async function Home() {
  const chapters = getChapters();
  const [fatihah, baqarah] = await Promise.all([getSurah(1), getSurah(2)]);
  const ayatAlKursi = baqarah.verses[254];

  return (
    <>
      <JsonLd data={[websiteLd(), faqLd(FAQS.map((f) => ({ q: f.q, a: f.a })))]} />
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
    </>
  );
}
