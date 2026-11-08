import { BentoFeatures } from "@/components/home/bento-features";
import { ContinueReading } from "@/components/home/continue-reading";
import { FatihahStory } from "@/components/home/fatihah-story";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { JuzIndex, SurahIndex } from "@/components/home/surah-index";
import { getChapters, getSurah } from "@/lib/quran";

export default async function Home() {
  const chapters = getChapters();
  const [fatihah, baqarah] = await Promise.all([getSurah(1), getSurah(2)]);
  const ayatAlKursi = baqarah.verses[254];

  return (
    <>
      <Hero chapters={chapters} />
      <Stats />
      <BentoFeatures sample={ayatAlKursi} />
      <FatihahStory verses={fatihah.verses} />
      <div className="mx-auto max-w-7xl px-4 pt-16 md:px-8">
        <ContinueReading chapters={chapters} />
      </div>
      <SurahIndex chapters={chapters} />
      <JuzIndex chapters={chapters} />
    </>
  );
}
