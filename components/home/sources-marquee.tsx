"use client";

import { useUi } from "@/components/providers/ui-messages";
import { RECITERS } from "@/lib/constants";
import type { Messages } from "@/lib/ui-messages/en";

const sourcesFor = (t: Messages["sources"]) => [
  { name: "Tanzil", note: t.uthmani },
  { name: "Saheeh International", note: t.english },
  { name: "QuranEnc", note: t.translations },
  { name: "Al-Mukhtaṣar", note: t.tafsir },
  ...RECITERS.map((r) => ({ name: r.name, note: r.wordSync ? t.synced : t.recitation })),
  { name: "Madani Mushaf", note: t.pages },
  { name: "Mutashābihāt", note: t.lookalike },
];

/** "Logo cloud" for a Qurʾān app: the sources the text, meaning and audio come from, on a slow loop. */
export function SourcesMarquee() {
  const { m } = useUi();
  const SOURCES = sourcesFor(m.sources);
  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0">
      {SOURCES.map((s) => (
        <li key={s.name} className="flex shrink-0 items-center gap-3 px-6">
          <span aria-hidden="true" className="text-gold-500">
            ۞
          </span>
          <span className="text-md font-semibold whitespace-nowrap text-secondary">{s.name}</span>
          <span className="text-sm whitespace-nowrap text-quaternary">{s.note}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-labelledby="sources-title" className="py-10 md:py-14">
      <h2 id="sources-title" className="text-center text-sm font-medium text-tertiary">
        {m.sources.title}
      </h2>
      <div className="group relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        {/* Two copies side by side; the track slides by half its width for a seamless loop. */}
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}
