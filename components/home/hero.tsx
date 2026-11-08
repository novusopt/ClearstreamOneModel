"use client";

import { ArrowRight, BookOpen01, ChevronDown } from "@untitledui/icons";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/base/buttons/button";

const HEADLINE = ["Read.", "Listen.", "Understand."];

export function Hero() {
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
        <div className="absolute -top-40 left-1/2 size-[46rem] -translate-x-1/2 animate-aurora rounded-full bg-brand-400/25 blur-3xl dark:bg-brand-600/20" />
        <div className="absolute top-1/3 -left-40 size-[30rem] animate-aurora rounded-full bg-gold-300/30 blur-3xl [animation-delay:-6s] dark:bg-gold-500/10" />
        <div className="absolute -right-32 bottom-0 size-[28rem] animate-aurora rounded-full bg-brand-200/40 blur-3xl [animation-delay:-12s] dark:bg-brand-800/30" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border-secondary)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-[size:24px_24px]" />
      </div>

      <motion.svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        style={{ rotate: starRotate, scale: starScale }}
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[56rem] -translate-x-1/2 -translate-y-1/2 text-brand-500/15"
      >
        <g fill="none" stroke="currentColor" strokeWidth="0.35" className="origin-center animate-spin-slow">
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="45" y="45" width="110" height="110" transform={`rotate(${i * 11.25} 100 100)`} />
          ))}
          <circle cx="100" cy="100" r="40" />
          <circle cx="100" cy="100" r="78" />
          <circle cx="100" cy="100" r="96" strokeDasharray="1 3" />
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
          className="font-quran text-6xl leading-tight sm:text-7xl md:text-8xl"
        >
          <span className="bg-gradient-to-br from-brand-500 via-brand-700 to-gold-500 bg-clip-text text-transparent dark:from-brand-200 dark:via-brand-400 dark:to-gold-300">
            ٱقْرَأْ بِٱسْمِ رَبِّكَ
          </span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-5 text-sm text-tertiary italic"
        >
          “Read in the name of your Lord” — Al-ʿAlaq 96:1
        </motion.p>

        <h1 className="mt-10 text-display-md font-semibold tracking-tight text-primary sm:text-display-lg md:text-display-xl">
          {HEADLINE.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 40, rotateX: -60 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.35 + i * 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={i === 2 ? "inline-block bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text pr-1 text-transparent" : "mr-3 inline-block"}
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
          The Qurʾān in Uthmani script with ten translations, word-by-word meanings, colour-coded tajweed and recitation that highlights every
          word as it’s recited.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="xl" href="/surah/1" iconLeading={BookOpen01}>
            Begin with Al-Fātiḥah
          </Button>
          <Button size="xl" color="secondary" href="#surahs" iconTrailing={ArrowRight}>
            Browse all 114 surahs
          </Button>
        </motion.div>
      </motion.div>

      <motion.a
        href="#features"
        aria-label="Scroll to features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.4 }, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
        className="absolute bottom-8 left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-full text-fg-quaternary ring-1 ring-secondary outline-focus-ring focus-visible:outline-2"
      >
        <ChevronDown className="size-5" />
      </motion.a>
    </section>
  );
}
