import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t border-secondary bg-secondary pb-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-tertiary">
            {BRAND.tagline}. Named after the lamp-niche of Āyat an-Nūr (24:35): a quiet place to read, listen and understand.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="font-semibold text-primary">Explore</h2>
          <ul className="space-y-2 text-tertiary">
            <li><Link className="hover:text-secondary" href="/surah/1">Al-Fātiḥah</Link></li>
            <li><Link className="hover:text-secondary" href="/surah/36">Yā-Sīn</Link></li>
            <li><Link className="hover:text-secondary" href="/surah/67">Al-Mulk</Link></li>
            <li><Link className="hover:text-secondary" href="/surah/18">Al-Kahf</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="font-semibold text-primary">Data &amp; credits</h2>
          <p className="text-tertiary">
            Word-by-word data, tajweed markup and timings from the open, MIT-licensed{" "}
            <a className="underline hover:text-secondary" href="https://github.com/ivosetyadi/quran-recital">quran-recital</a> dataset (Quran.com API-derived).
            Translations from <a className="underline hover:text-secondary" href="https://tanzil.net">Tanzil</a> and{" "}
            <a className="underline hover:text-secondary" href="https://quranenc.com">QuranEnc</a>. Recitation streamed from{" "}
            <a className="underline hover:text-secondary" href="https://alquran.cloud">Islamic Network</a> and EveryAyah.
          </p>
        </div>
      </div>
    </footer>
  );
}
