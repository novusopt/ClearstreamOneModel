"use client";

import { ArrowRight, BookOpen01, CheckCircle } from "@untitledui/icons";
import { Fragment } from "react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import Link from "next/link";
import { HeroLiquid } from "@/components/home/hero-liquid";
import { HeroShowcase } from "@/components/home/hero-showcase";
import { useUi } from "@/components/providers/ui-messages";
import { fmt } from "@/lib/ui-format";
import { useLibrary } from "@/lib/library";
import { cx } from "@/utils/cx";
import type { Chapter, Verse } from "@/lib/types";

/** The opening of An-Nur 24:35, the verse Mishkah is named after (verbatim, checked by verify-quran-data). */
const NUR = "ٱللَّهُ نُورُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ";

export function Hero({ chapters, fatihah }: { chapters: Chapter[]; fatihah?: Verse[] }) {
  const { m: t, href, lang } = useUi();
  // Chinese headlines are not space-separated.
  const wordGap = lang === "zh" ? "" : " ";
  const lastRead = useLibrary((s) => s.lastRead);
  const resume = lastRead ? chapters[lastRead.surah - 1] : null;

  return (
    <section className="relative isolate overflow-hidden pt-40 pb-16 md:pt-52 md:pb-24">
      {/* Backdrop: liquid light in indigo and lantern amber (HeroLiquid), fading into the page. */}
      <HeroLiquid />

      <div className="mx-auto w-full max-w-7xl px-4 text-center md:px-8">
        {/* An-Nur 24:35, the verse Mishkah is named after. */}
        <p lang="ar" dir="rtl" className="enter-visible font-quran text-3xl leading-tight text-gold-700 sm:text-4xl dark:text-gold-300">
          {NUR}
        </p>
        <p className="enter mt-2 text-sm text-tertiary italic" style={{ animationDelay: "0.9s" }}>
          {t.hero.verseGloss}
        </p>

        <div className="enter mt-8 flex justify-center" style={{ animationDelay: "0.25s" }}>
          <Link
            href={href("/#journey")}
            className="group inline-flex items-center gap-3 rounded-full border border-secondary bg-primary/80 py-1 pr-3 pl-1 text-sm font-medium text-secondary shadow-xs backdrop-blur transition hover:border-brand hover:text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Badge type="pill-color" color="brand" size="sm">
              {t.hero.newBadge}
            </Badge>
            {t.hero.newText}
            <ArrowRight aria-hidden="true" className="size-4 text-fg-quaternary transition group-hover:translate-x-0.5 group-hover:text-fg-brand-secondary rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </div>

        <h1 className="mt-6 text-display-md font-display font-medium tracking-tight text-primary sm:text-display-lg md:text-display-2xl">
          {t.hero.headline.map((word, i) => (
            <Fragment key={word}>
              <span
                style={{ animationDelay: `${0.8 + i * 0.06}s` }}
                className={cx("enter-word-visible inline-block", lang !== "zh" && "mr-[0.15em]")}
              >
                {word}
              </span>
              {wordGap}
            </Fragment>
          ))}
        </h1>
        <p className="enter-visible mx-auto mt-6 max-w-2xl text-lg text-tertiary md:max-w-[32rem] md:text-xl" style={{ animationDelay: "0.3s" }}>
          {t.hero.intro}
        </p>
        <div className="enter mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.65s" }}>
          {resume && lastRead ? (
            <Button size="xl" href={href(`/surah/${resume.id}#v-${lastRead.ayah}`)} iconLeading={BookOpen01}>
              {fmt(t.hero.continueAt, { name: resume.nameSimple, ref: `${resume.id}:${lastRead.ayah}` })}
            </Button>
          ) : (
            <Button size="xl" href={href("/surah/1")} iconLeading={BookOpen01}>
              {t.hero.openFatihah}
            </Button>
          )}
          <Button size="xl" color="secondary" href="#surahs" iconTrailing={<ArrowRight data-icon aria-hidden="true" className="rtl:rotate-180" />}>
            {t.hero.browse}
          </Button>
        </div>
        <ul
          style={{ animationDelay: "0.8s" }}
          className="enter mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-tertiary"
        >
          {t.hero.trust.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <CheckCircle aria-hidden="true" className="size-4 text-fg-success-secondary" />
              {item}
            </li>
          ))}
        </ul>

        {fatihah && fatihah.length > 0 && (
          <div className="enter-up" style={{ animationDelay: "0.7s" }}>
            <HeroShowcase verses={fatihah} />
          </div>
        )}
      </div>
    </section>
  );
}
