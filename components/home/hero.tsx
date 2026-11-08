"use client";

import { ArrowRight, BookOpen01, ChevronDown } from "@untitledui/icons";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/base/buttons/button";
import { useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

const HEADLINE = ["A", "lantern", "for", "the", "Qurʾān."];

export function Hero({ chapters }: { chapters: Chapter[] }) {
  const lastRead = useLibrary((s) => s.lastRead);
  const resume = lastRead ? chapters[lastRead.surah - 1] : null;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const arabicY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const starRotate = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const starScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-20">
      {/* Aurora backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 via-transparent to-transparent dark:from-brand-950/80" />
        <div className="absolute top-[18%] left-1/2 size-[38rem] -translate-x-1/2 animate-flicker rounded-full bg-gold-300/35 blur-3xl dark:bg-gold-500/15" />
        <div className="absolute -top-40 -left-40 size-[34rem] animate-aurora rounded-full bg-brand-300/25 blur-3xl dark:bg-brand-700/25" />
        <div className="absolute -right-40 bottom-0 size-[30rem] animate-aurora rounded-full bg-brand-200/30 blur-3xl [animation-delay:-9s] dark:bg-brand-800/30" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border-secondary)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-[size:24px_24px]" />
      </div>

      <motion.svg
        aria-hidden="true"
        viewBox="0 0 200 260"
        style={{ scale: starScale }}
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[52rem] -translate-x-1/2 -translate-y-1/2 text-brand-500/20 dark:text-brand-300/15"
      >
        <g fill="none" stroke="currentColor">
          <path d="M20 258 V110 C20 60 60 22 100 4 C140 22 180 60 180 110 V258" strokeWidth="0.8" />
          <path d="M36 258 V114 C36 72 68 40 100 26 C132 40 164 72 164 114 V258" strokeWidth="0.5" strokeDasharray="2 3" />
          <motion.path style={{ rotate: starRotate }} d="M100 70 l8 14 16 -2 -2 16 14 8 -14 8 2 16 -16 -2 -8 14 -8 -14 -16 2 2 -16 -14 -8 14 -8 -2 -16 16 2 Z" strokeWidth="0.6" />
        </g>
      </motion.svg>

      <motion.div style={{ y, opacity }} className="mx-auto w-full max-w-6xl px-4 text-center md:px-8">
        <motion.p
          style={{ y: arabicY }}
          initial={{ opacity: 0, scale: 0.9, filter: "blur(16px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          lang="ar"
          dir="rtl"
          className="font-quran text-5xl leading-tight sm:text-6xl md:text-7xl"
        >
          <span className="bg-gradient-to-br from-brand-700 via-brand-500 to-gold-500 bg-clip-text text-transparent dark:from-gold-200 dark:via-gold-300 dark:to-brand-300">
            ٱللَّهُ نُورُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ
          </span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-5 text-sm text-tertiary italic"
        >
          “Allah is the Light of the heavens and the earth” — An-Nūr 24:35
        </motion.p>

        <h1 className="mt-10 text-display-md font-display font-medium tracking-tight text-primary sm:text-display-lg md:text-display-xl">
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.4 }, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ButtonUtility href="#features" size="sm" color="secondary" tooltip="Scroll to features" icon={ChevronDown} className="rounded-full" />
      </motion.div>
    </section>
  );
}
