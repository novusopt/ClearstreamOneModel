"use client";

import { ArrowRight, BookOpen01, CheckCircle } from "@untitledui/icons";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/base/buttons/button";
import Link from "next/link";
import { HeroShowcase } from "@/components/home/hero-showcase";
import { useLibrary } from "@/lib/library";
import type { Chapter, Verse } from "@/lib/types";

const HEADLINE = ["A", "lantern", "for", "the", "Qurʾān."];

const TRUST = ["Free, no account", "Private: saved on your device", "Works offline"];

export function Hero({ chapters, fatihah }: { chapters: Chapter[]; fatihah?: Verse[] }) {
  const lastRead = useLibrary((s) => s.lastRead);
  const resume = lastRead ? chapters[lastRead.surah - 1] : null;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const arabicY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const starRotate = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const starScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
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

      <motion.svg
        aria-hidden="true"
        viewBox="0 0 200 260"
        style={{ scale: starScale }}
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[52rem] -translate-x-1/2 text-brand-500/20 dark:text-brand-300/15"
      >
        <g fill="none" stroke="currentColor">
          <path d="M20 258 V110 C20 60 60 22 100 4 C140 22 180 60 180 110 V258" strokeWidth="0.8" />
          <path d="M36 258 V114 C36 72 68 40 100 26 C132 40 164 72 164 114 V258" strokeWidth="0.5" strokeDasharray="2 3" />
          <motion.path style={{ rotate: starRotate }} d="M100 70 l8 14 16 -2 -2 16 14 8 -14 8 2 16 -16 -2 -8 14 -8 -14 -16 2 2 -16 -14 -8 14 -8 -2 -16 16 2 Z" strokeWidth="0.6" />
        </g>
      </motion.svg>

      <div className="mx-auto w-full max-w-7xl px-4 text-center md:px-8">
        <motion.p
          style={{ y: arabicY }}
          initial={{ opacity: 0, scale: 0.9, filter: "blur(16px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          lang="ar"
          dir="rtl"
          className="font-quran text-3xl leading-tight sm:text-4xl"
        >
          <span className="bg-gradient-to-br from-brand-700 via-brand-500 to-gold-500 bg-clip-text text-transparent dark:from-gold-200 dark:via-gold-300 dark:to-brand-300">
            ٱللَّهُ نُورُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ
          </span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 text-sm text-tertiary italic"
        >
          “Allah is the Light of the heavens and the earth” — An-Nūr 24:35
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="mt-8 flex justify-center">
          <Link
            href="/#journey"
            className="group inline-flex items-center gap-3 rounded-full border border-secondary bg-primary/80 py-1 pr-3 pl-1 text-sm font-medium text-secondary shadow-xs backdrop-blur transition hover:border-brand hover:text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span className="rounded-full bg-brand-solid px-2.5 py-0.5 text-xs font-semibold text-white">New</span>
            Tafsir in 9 languages and memorisation review
            <ArrowRight aria-hidden="true" className="size-4 text-fg-quaternary transition group-hover:translate-x-0.5 group-hover:text-fg-brand-secondary" />
          </Link>
        </motion.div>

        <h1 className="mt-6 text-display-md font-display font-medium tracking-tight text-primary sm:text-display-lg md:text-display-2xl">
          {HEADLINE.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 40, rotateX: -60 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.35 + i * 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={i >= 3 ? "mr-3 inline-block bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text pr-1 text-transparent italic" : "mr-3 inline-block"}
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-tertiary md:text-xl"
        >
          Read the Uthmani text, listen as every word lights up with the recitation, and understand it word by word, in ten languages,
          with tajweed in colour.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          {resume && lastRead ? (
            <Button size="xl" href={`/surah/${resume.id}#v-${lastRead.ayah}`} iconLeading={BookOpen01}>
              Continue {resume.nameSimple} · {resume.id}:{lastRead.ayah}
            </Button>
          ) : (
            <Button size="xl" href="/surah/1" iconLeading={BookOpen01}>
              Open Al-Fātiḥah
            </Button>
          )}
          <Button size="xl" color="secondary" href="#surahs" iconTrailing={ArrowRight}>
            Browse all 114 surahs
          </Button>
        </motion.div>
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-tertiary"
        >
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <CheckCircle aria-hidden="true" className="size-4 text-fg-success-secondary" />
              {t}
            </li>
          ))}
        </motion.ul>

        {fatihah && fatihah.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
            <HeroShowcase verses={fatihah} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
