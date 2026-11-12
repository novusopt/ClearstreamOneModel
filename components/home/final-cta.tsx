"use client";

import { ArrowRight, BookOpen01 } from "@untitledui/icons";
import { m } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { useUi } from "@/components/providers/ui-messages";

/** Closing call to action: a midnight niche with the lantern lit. */
export function FinalCta() {
  const { m: msg, href } = useUi();
  const t = msg.cta;
  return (
    <section className="px-4 pb-24 md:px-8">
      <m.div
        initial={{ y: 40, scale: 0.97 }}
        whileInView={{ y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-brand-section px-6 py-16 text-center md:py-24"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/15 blur-3xl" />
          <svg viewBox="0 0 200 260" className="absolute top-1/2 left-1/2 h-[140%] -translate-x-1/2 -translate-y-1/2 text-white/10">
            <g fill="none" stroke="currentColor">
              <path d="M20 258 V110 C20 60 60 22 100 4 C140 22 180 60 180 110 V258" strokeWidth="0.8" />
              <path d="M36 258 V114 C36 72 68 40 100 26 C132 40 164 72 164 114 V258" strokeWidth="0.5" strokeDasharray="2 3" />
            </g>
          </svg>
        </div>
        <div className="relative">
          <p lang="ar" dir="rtl" className="font-quran text-3xl text-gold-200 md:text-4xl">
            ٱقْرَأْ بِٱسْمِ رَبِّكَ
          </p>
          <p className="mt-2 text-sm text-tertiary_on-brand italic">{t.verseGloss}</p>
          <h2 className="mx-auto mt-8 max-w-2xl font-display text-display-sm font-medium tracking-tight text-primary_on-brand md:text-display-lg">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-secondary_on-brand">{t.intro}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" color="secondary" href={href("/surah/1")} iconLeading={BookOpen01}>
              {t.openFatihah}
            </Button>
            <Button size="xl" href={href("/#surahs")} iconTrailing={<ArrowRight data-icon aria-hidden="true" className="rtl:rotate-180" />} className="bg-white/10 text-white ring-white/20 hover:bg-white/15">
              {t.browse}
            </Button>
          </div>
        </div>
      </m.div>
    </section>
  );
}
