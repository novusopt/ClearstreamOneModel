"use client";

import { Headphones02, Palette, PlayCircle } from "@untitledui/icons";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { TajweedText } from "@/components/quran/tajweed-text";
import { rulesIn } from "@/components/quran/word";
import type { Verse } from "@/lib/types";
import { cx } from "@/utils/cx";

/** Flattened word list with each word's recited length (Al-Husary timings). */
function useWordTrack(verses: Verse[]) {
  return useMemo(
    () =>
      verses.flatMap((v, vi) =>
        v.w.map((w, wi) => ({ vi, wi, ms: w.s != null && w.f != null ? Math.min(1300, Math.max(380, w.f - w.s)) : 650 })),
      ),
    [verses],
  );
}

/**
 * The hero's product shot: a live, miniature Mishkah reader playing Al-Fātiḥah. Words light up at the
 * real recitation pace and the word card follows. Purely illustrative: not focusable, described for
 * screen readers in one sentence.
 */
export function HeroShowcase({ verses }: { verses: Verse[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const track = useWordTrack(verses);
  // Start on a word in ayah 2 so a still frame (reduced motion, thumbnails) shows a lit word.
  const [pos, setPos] = useState(() => Math.max(0, track.findIndex((t) => t.vi === 1)));

  useEffect(() => {
    if (!inView || reduce || track.length === 0) return;
    const id = window.setTimeout(() => setPos((p) => (p + 1) % track.length), track[pos]?.ms ?? 650);
    return () => window.clearTimeout(id);
  }, [inView, reduce, pos, track]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  const cur = track[pos] ?? { vi: 0, wi: 0 };
  const verse = verses[cur.vi];
  const word = verse?.w[cur.wi];
  const rules = word && typeof word.j !== "string" ? rulesIn(word.j) : [];
  const progress = track.length ? (pos + 1) / track.length : 0;

  return (
    <div ref={ref} className="relative isolate mx-auto mt-16 max-w-6xl [perspective:1600px] md:mt-20">
      {/* Lantern glow under the window */}
      <div aria-hidden="true" className="absolute inset-x-[12%] top-[8%] bottom-0 -z-10 rounded-full bg-gold-400/30 blur-3xl dark:bg-gold-500/15" />
      <p className="sr-only">Preview of the Mishkah reader playing Al-Fātiḥah, with each word lighting up as it is recited.</p>
      <motion.div
        aria-hidden="true"
        style={{ rotateX, scale, transformOrigin: "50% 0%" }}
        className="overflow-hidden rounded-2xl border border-secondary bg-primary text-left shadow-3xl ring-1 ring-black/5 md:rounded-3xl dark:ring-white/5"
      >
        {/* Window chrome */}
        <div className="flex h-10 items-center gap-3 border-b border-secondary bg-secondary px-4">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-quaternary" />
            <span className="size-2.5 rounded-full bg-quaternary" />
            <span className="size-2.5 rounded-full bg-quaternary" />
          </div>
          <div className="mx-auto flex h-6 w-full max-w-xs items-center justify-center rounded-md bg-primary text-xs text-quaternary ring-1 ring-secondary">
            mishkah · Al-Fātiḥah
          </div>
          <span className="w-10" />
        </div>

        <div className="grid lg:grid-cols-[1fr_17rem]">
          <div className="min-w-0">
            {/* Reader bar */}
            <div className="flex items-center gap-3 border-b border-secondary px-4 py-3 md:px-6">
              <span lang="ar" dir="rtl" className="font-quran text-xl text-brand-secondary">
                الفاتحة
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-sm font-semibold text-primary">Al-Fātiḥah</p>
                <p className="text-xs text-tertiary tabular-nums">
                  Ayah {verse?.n ?? 1} of 7 · Page 1 · Juzʾ 1
                </p>
              </div>
              <span className="ml-auto hidden sm:inline-flex">
                <BadgeWithIcon type="pill-color" color="brand" size="md" iconLeading={Headphones02}>
                  Listening
                </BadgeWithIcon>
              </span>
              <span className="hidden md:inline-flex">
                <Badge type="modern" size="md">
                  Study preset
                </Badge>
              </span>
            </div>

            {/* Text */}
            <div dir="rtl" lang="ar" className="px-4 pt-6 pb-4 text-center font-quran text-2xl leading-[2.4] text-primary sm:text-3xl md:px-10 md:text-[2.1rem]">
              {verses.map((v, vi) => (
                <span key={v.n}>
                  {v.w.map((w, wi) => (
                    <span key={wi}>
                      <span
                        className={cx(
                          "rounded-lg px-0.5 transition-colors duration-300",
                          vi === cur.vi && wi === cur.wi ? "bg-gold-100 dark:bg-gold-500/20" : vi === cur.vi ? "" : "opacity-55",
                        )}
                      >
                        <TajweedText value={w.j} />
                      </span>{" "}
                    </span>
                  ))}
                  <AyahMarker n={v.n} active={vi === cur.vi} />{" "}
                </span>
              ))}
            </div>

            <div className="min-h-16 px-4 pb-5 text-center md:px-10">
              <AnimatePresence mode="wait">
                <motion.p
                  key={verse?.n}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="mx-auto max-w-xl text-sm text-tertiary md:text-md"
                >
                  {verse?.en}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Side panel: the word being recited */}
          <div className="hidden flex-col gap-3 border-l border-secondary bg-secondary/50 p-4 lg:flex">
            <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Now reciting</p>
            <div className="rounded-xl border border-secondary bg-primary p-4 text-center shadow-xs">
              <motion.div key={`${cur.vi}-${cur.wi}`} initial={{ opacity: 0.4, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                  <p lang="ar" dir="rtl" className="font-quran text-4xl leading-[1.8] text-primary">
                    {word && <TajweedText value={word.j} />}
                  </p>
                  <p className="font-display text-md text-gold-700 italic dark:text-gold-300">{word?.t}</p>
                  <p className="mt-0.5 text-sm text-secondary">{word?.e}</p>
              </motion.div>
            </div>
            <div className="rounded-xl border border-secondary bg-primary p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-700 dark:text-gold-300">
                <Palette className="size-3.5" /> Tajweed in this word
              </p>
              <ul className="mt-2 flex min-h-12 flex-wrap content-start gap-1.5">
                {rules.length > 0 ? (
                  rules.map((r) => (
                    <li key={r.id}>
                      <Badge type="modern" size="sm">
                        <span className={`tj-${r.classes[0]} mr-1 size-1.5 rounded-full bg-current`} />
                        {r.name}
                      </Badge>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-quaternary">No rule on this word</li>
                )}
              </ul>
            </div>
            <div className="mt-auto rounded-xl border border-secondary bg-primary p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-secondary">Today</span>
                <span className="text-tertiary tabular-nums">{Math.round(progress * 7)} / 7 ayat</span>
              </div>
              <ProgressBarBase value={progress * 100} className="mt-2 h-1.5" progressClassName="duration-500" />
            </div>
          </div>
        </div>

        {/* Player */}
        <div className="flex items-center gap-3 border-t border-secondary bg-secondary/60 px-4 py-3 md:px-6">
          <PlayCircle className="size-7 shrink-0 text-fg-brand-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold text-secondary">Mahmoud Khalil Al-Husary</span>
              <span className="hidden text-tertiary sm:inline">Word-synced · 1×</span>
            </div>
            <ProgressBarBase value={progress * 100} className="mt-1.5 h-1" progressClassName="bg-gold-500 duration-500" />
          </div>
          <span className="flex h-5 items-end gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-1 animate-equalizer rounded-full bg-fg-brand-secondary motion-reduce:animate-none" style={{ height: "100%", animationDelay: `${i * -0.25}s` }} />
            ))}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
