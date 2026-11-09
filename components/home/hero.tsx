"use client";

import { ArrowRight, BookOpen01, CheckCircle } from "@untitledui/icons";
import { m, useScroll, useTransform } from "motion/react";
import { Fragment, useRef } from "react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import Link from "next/link";
import { HeroLamp, HeroNiche } from "@/components/home/hero-niche";
import { HeroShowcase } from "@/components/home/hero-showcase";
import { useUi } from "@/components/providers/ui-messages";
import { fmt } from "@/lib/ui-format";
import { useLibrary } from "@/lib/library";
import { cx } from "@/utils/cx";
import type { Chapter, Verse } from "@/lib/types";

export function Hero({ chapters, fatihah }: { chapters: Chapter[]; fatihah?: Verse[] }) {
  const { m: t, href, lang } = useUi();
  // Chinese headlines are not space-separated.
  const wordGap = lang === "zh" ? "" : " ";
  const lastRead = useLibrary((s) => s.lastRead);
  const resume = lastRead ? chapters[lastRead.surah - 1] : null;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const arabicY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const archScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden pt-32 pb-16 md:pt-44 md:pb-24">
      {/* Aurora backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 via-transparent to-transparent dark:from-brand-950/80" />
        <div className="absolute top-[18%] left-1/2 size-[38rem] -translate-x-1/2 animate-flicker rounded-full bg-gold-300/35 blur-3xl dark:bg-gold-500/15" />
        <div className="absolute -top-40 -left-40 size-[34rem] animate-aurora rounded-full bg-brand-300/25 blur-3xl dark:bg-brand-700/25" />
        <div className="absolute -right-40 bottom-0 size-[30rem] animate-aurora rounded-full bg-brand-200/30 blur-3xl [animation-delay:-9s] dark:bg-brand-800/30" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border-secondary)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-[size:24px_24px]" />
        {/* Fade into the page so the backdrop has no hard bottom edge. */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-bg-primary" />
      </div>

      <HeroNiche scale={archScale} />
      <HeroLamp />

      <div className="mx-auto w-full max-w-7xl px-4 text-center md:px-8">
        <m.p
          style={{ y: arabicY }}
          lang="ar"
          dir="rtl"
          className="font-quran text-3xl leading-tight sm:text-4xl"
        >
          <span className="enter-blur inline-block bg-gradient-to-br from-brand-700 via-brand-500 to-gold-500 bg-clip-text text-transparent dark:from-gold-200 dark:via-gold-300 dark:to-brand-300">
            ٱللَّهُ نُورُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ
          </span>
        </m.p>
        <p className="enter mt-2 text-sm text-tertiary italic" style={{ animationDelay: "0.6s" }}>
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
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                className={cx("enter-word-visible inline-block", lang !== "zh" && "mr-[0.15em]", i >= t.hero.highlightFrom && "bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text pr-1 text-transparent italic")}
              >
                {word}
              </span>
              {wordGap}
            </Fragment>
          ))}
        </h1>
        <p className="enter-visible mx-auto mt-6 max-w-2xl text-lg text-tertiary md:max-w-[34rem] md:text-xl" style={{ animationDelay: "0.3s" }}>
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
