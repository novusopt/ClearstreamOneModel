import { Button } from "@/components/base/buttons/button";
import { Logo } from "@/components/site/logo";
import { BRAND } from "@/lib/brand";

const EXPLORE = [
  { href: "/surah/1", label: "Al-Fātiḥah" },
  { href: "/surah/36", label: "Yā-Sīn" },
  { href: "/surah/67", label: "Al-Mulk" },
  { href: "/surah/18", label: "Al-Kahf" },
];

const CREDITS = [
  { href: "https://github.com/ivosetyadi/quran-recital", label: "quran-recital (MIT)", note: "Words, glosses, timings, tajweed markup (Quran.com API-derived)" },
  { href: "https://tanzil.net", label: "Tanzil", note: "Translations and transliteration" },
  { href: "https://quranenc.com", label: "QuranEnc", note: "Indonesian and Chinese translations" },
  { href: "https://alquran.cloud", label: "Islamic Network", note: "Recitation audio, with EveryAyah as fallback" },
];

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
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-primary">Explore</h2>
          <ul className="flex flex-col items-start gap-2">
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Button href={l.href} color="link-gray" size="sm">
                  {l.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-primary">Data &amp; credits</h2>
          <ul className="flex flex-col items-start gap-2.5">
            {CREDITS.map((c) => (
              <li key={c.href} className="flex flex-col items-start">
                <Button href={c.href} color="link-gray" size="sm" target="_blank" rel="noreferrer">
                  {c.label}
                </Button>
                <span className="text-xs text-quaternary">{c.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
