import Link from "next/link";
import { Logo } from "@/components/site/logo";

export function Footer() {
  return (
    <footer className="border-t border-secondary bg-secondary pb-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-tertiary">
            A calm, modern place to read, listen to and understand the Qurʾān — word by word.
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
          <h2 className="font-semibold text-primary">Sources</h2>
          <p className="text-tertiary">
            Text, word-by-word data, tajweed and timings derived from the Quran.com API (via the MIT-licensed{" "}
            <a className="underline hover:text-secondary" href="https://github.com/ivosetyadi/quran-recital">quran-recital</a> dataset).
            Translations from <a className="underline hover:text-secondary" href="https://tanzil.net">Tanzil</a> and{" "}
            <a className="underline hover:text-secondary" href="https://quranenc.com">QuranEnc</a>. Audio streamed from{" "}
            <a className="underline hover:text-secondary" href="https://alquran.cloud">Islamic Network</a> and EveryAyah.
          </p>
        </div>
      </div>
    </footer>
  );
}
