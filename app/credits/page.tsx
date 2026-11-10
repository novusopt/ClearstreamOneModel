import { ArrowUpRight, CheckVerified01 } from "@untitledui/icons";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { JsonLd } from "@/components/seo/json-ld";
import { RECITERS, TAFSIR_SOURCE, TRANSLATIONS } from "@/lib/constants";
import { breadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Credits & sources",
  description:
    "Where Mishkah's Qurʾān text, translations, tafsir, word-by-word meanings, recitations, fonts and software come from, with their licences, and how the text is verified.",
  alternates: { canonical: "/credits" },
};

/** Translations from QuranEnc; the others come from Tanzil (both via quran-json). */
const QURANENC = new Set(["id", "zh"]);

type Credit = { name: string; href?: string; role: ReactNode; licence?: string };

function Section({ id, title, intro, items }: { id: string; title: string; intro?: ReactNode; items: Credit[] }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-28">
      <h2 id={id} className="font-display text-xl font-medium text-primary">
        {title}
      </h2>
      {intro && <p className="mt-1.5 max-w-2xl text-md text-tertiary">{intro}</p>}
      <ul className="mt-4 divide-y divide-secondary overflow-hidden rounded-2xl border border-secondary bg-primary shadow-xs">
        {items.map((c) => (
          <li key={c.name} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              {c.href ? (
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1 rounded text-md font-semibold text-primary outline-focus-ring hover:text-brand-secondary focus-visible:outline-2"
                >
                  {c.name}
                  <ArrowUpRight aria-hidden="true" className="size-4 text-fg-quaternary transition group-hover:text-fg-brand-secondary" />
                </a>
              ) : (
                <p className="text-md font-semibold text-primary">{c.name}</p>
              )}
              <p className="mt-0.5 text-sm text-tertiary">{c.role}</p>
            </div>
            {c.licence && (
              <Badge type="modern" color="gray" size="sm" className="shrink-0 self-start">
                {c.licence}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CreditsPage() {
  return (
    <article className="relative overflow-hidden pt-24 pb-32 md:pt-28">
      <JsonLd
        data={breadcrumbLd([
          { name: "Mishkah", path: "/" },
          { name: "Credits & sources", path: "/credits" },
        ])}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/60" />
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <header className="border-b border-secondary pb-6">
          <p className="text-sm font-semibold text-gold-700 dark:text-gold-300">Credits & sources</p>
          <h1 className="mt-2 font-display text-display-sm font-medium tracking-tight text-primary">Built on the work of many</h1>
          <p className="mt-3 max-w-2xl text-lg text-tertiary">
            Every word of the Qurʾān, every translation and every recitation in Mishkah comes from openly published sources. Here they are, with
            their licences, and how the text is checked.
          </p>
        </header>

        <div className="mt-8 flex gap-4 rounded-2xl border border-brand bg-brand-primary_alt p-5">
          <FeaturedIcon icon={CheckVerified01} color="brand" theme="light" size="md" className="shrink-0" />
          <div>
            <p className="text-md font-semibold text-primary">How the Qurʾān text is verified</p>
            <p className="mt-1 text-sm text-tertiary">
              Every build checks all 6,236 ayat, letter for letter, against an independent text from the King Fahd Glorious Qurʾān Printing
              Complex (KFGQPC); juzʾ, ḥizb, page and sajdah positions against quran-meta; and each translation against its source. Corrections to
              upstream errors are documented in the build and checked against the original, and the build fails if anything drifts.
            </p>
          </div>
        </div>

        <div className="mt-12 space-y-12">
          <Section
            id="text"
            title="Qurʾān text"
            items={[
              {
                name: "Quran.com via quran-recital",
                href: "https://github.com/ivosetyadi/quran-recital",
                role: "Uthmani text word by word, tajweed markup, transliteration, English word-by-word meanings and Al-Husary's recitation timings.",
                licence: "MIT",
              },
              {
                name: "King Fahd Glorious Qurʾān Printing Complex (KFGQPC), via quran-json",
                href: "https://github.com/risan/quran-json",
                role: "Reference Uthmani text (Ḥafṣ ʿan ʿĀṣim) every ayah is verified against; QPC Hafs for individual readings checked by hand.",
                licence: "CC BY 4.0",
              },
              {
                name: "Quran.com API",
                href: "https://quran.com",
                role: "Word positions for word-by-word audio, and the reference the glosses and transliteration are checked against.",
              },
              { name: "quran-meta", href: "https://www.npmjs.com/package/quran-meta", role: "Mushaf pages, juzʾ, ḥizb quarters and sajdah positions (Madani muṣḥaf).", licence: "MIT" },
            ]}
          />

          <Section
            id="translations"
            title="Translations"
            intro={
              <>
                Through{" "}
                <a href="https://github.com/risan/quran-json" target="_blank" rel="noreferrer" className="font-medium text-brand-secondary underline-offset-4 hover:underline">
                  quran-json
                </a>{" "}
                (CC BY 4.0), from Tanzil and QuranEnc. Quoted exactly, including the translators’ bracketed clarifications.
              </>
            }
            items={TRANSLATIONS.map((t) => ({
              name: `${t.language}: ${t.author}`,
              href: QURANENC.has(t.id) ? "https://quranenc.com" : "https://tanzil.net/trans/",
              role: QURANENC.has(t.id) ? "Published by QuranEnc" : "Published by Tanzil",
            }))}
          />

          <Section
            id="tafsir"
            title="Tafsir"
            items={[
              {
                name: `${TAFSIR_SOURCE.name}`,
                href: TAFSIR_SOURCE.url,
                role: `By the ${TAFSIR_SOURCE.author}, in nine languages; Urdu and Swedish readers see the English edition, labelled. Collected by spa5k/tafsir_api.`,
              },
              {
                name: "Quran Mutashabihat Data",
                href: "https://github.com/Waqar144/Quran_Mutashabihat_Data",
                role: "Ayat with near-identical wording (mutashābihāt), shown as “Similar wording”.",
                licence: "CC0 1.0",
              },
            ]}
          />

          <Section
            id="audio"
            title="Recitation audio"
            intro="Streamed from these services while you listen; Mishkah does not host recordings."
            items={[
              { name: "Islamic Network (alquran.cloud)", href: "https://alquran.cloud", role: "Ayah-by-ayah recitations, the primary source." },
              { name: "EveryAyah", href: "https://everyayah.com", role: "Ayah-by-ayah recitations, used when the primary source is unavailable." },
              { name: "Quran.com", href: "https://quran.com", role: "Word-by-word pronunciation." },
              ...RECITERS.map((r) => ({ name: r.name, role: `Reciter · ${r.style}` })),
            ]}
          />

          <Section
            id="fonts"
            title="Typefaces"
            items={[
              { name: "Amiri Quran", href: "https://github.com/aliftype/amiri", role: "The Qurʾān text. By Khaled Hosny.", licence: "SIL OFL 1.1" },
              { name: "Fraunces", href: "https://github.com/undercasetype/Fraunces", role: "Headings. By Undercase Type.", licence: "SIL OFL 1.1" },
              { name: "Inter", href: "https://github.com/rsms/inter", role: "Interface text. By Rasmus Andersson.", licence: "SIL OFL 1.1" },
            ]}
          />

          <Section
            id="software"
            title="Software"
            items={[
              { name: "Untitled UI React", href: "https://www.untitledui.com/react", role: "Interface components and icons.", licence: "MIT" },
              { name: "React Aria Components", href: "https://react-spectrum.adobe.com/react-aria/", role: "Accessible component primitives under Untitled UI.", licence: "Apache 2.0" },
              { name: "Next.js and React", href: "https://nextjs.org", role: "Framework and rendering.", licence: "MIT" },
              { name: "Tailwind CSS", href: "https://tailwindcss.com", role: "Styling.", licence: "MIT" },
              { name: "Motion and Lenis", href: "https://motion.dev", role: "Animation and smooth scrolling.", licence: "MIT" },
              { name: "sonner and next-themes", href: "https://github.com/emilkowalski/sonner", role: "Notifications and light/dark theme.", licence: "MIT" },
              { name: "country-flag-icons", href: "https://gitlab.com/catamphetamine/country-flag-icons", role: "Flags in the language menu.", licence: "MIT" },
              { name: "Vercel Analytics and Speed Insights", href: "https://vercel.com/docs/analytics", role: "Anonymous, cookie-free page views and performance.", licence: "MIT · Apache 2.0" },
            ]}
          />
        </div>
      </div>
    </article>
  );
}
