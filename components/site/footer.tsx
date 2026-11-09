"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Logo } from "@/components/site/logo";
import type { Lang } from "@/lib/i18n";
import { langFromPath, localizeHref } from "@/lib/locale-path";
import type { ChromeMessages } from "@/lib/ui-messages";

type FooterStrings = ChromeMessages["footer"];

const exploreFor = (f: FooterStrings, lang: Lang) => [
  { href: localizeHref(lang, "/surah/1"), label: "Al-Fātiḥah" },
  { href: localizeHref(lang, "/surah/36"), label: "Yā-Sīn" },
  { href: localizeHref(lang, "/surah/67"), label: "Al-Mulk" },
  { href: localizeHref(lang, "/surah/18"), label: "Al-Kahf" },
  { href: "/review", label: f.review },
  { href: localizeHref(lang, "/#faq"), label: f.faq },
];

const creditsFor = (f: FooterStrings) => [
  { href: "https://github.com/ivosetyadi/quran-recital", label: "quran-recital (MIT)", note: f.notes.recital },
  { href: "https://tanzil.net", label: "Tanzil", note: f.notes.tanzil },
  { href: "https://quranenc.com", label: "QuranEnc", note: f.notes.quranenc },
  { href: "https://github.com/spa5k/tafsir_api", label: "Al-Mukhtaṣar tafsir", note: f.notes.tafsir },
  { href: "https://github.com/Waqar144/Quran_Mutashabihat_Data", label: "Quran Mutashabihat Data (CC0)", note: f.notes.similar },
  { href: "https://alquran.cloud", label: "Islamic Network", note: f.notes.audio },
];

export function Footer({ chrome }: { chrome: Record<Lang, ChromeMessages> }) {
  const lang = langFromPath(usePathname());
  const f = chrome[lang].footer;
  return (
    <footer className="border-t border-secondary bg-secondary pb-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-tertiary">{f.about}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-primary">{f.explore}</h2>
          <ul className="flex flex-col items-start gap-2">
            {exploreFor(f, lang).map((l) => (
              <li key={l.href}>
                <Button href={l.href} color="link-gray" size="sm">
                  {l.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-primary">{f.credits}</h2>
          <ul className="flex flex-col items-start gap-2.5">
            {creditsFor(f).map((c) => (
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
