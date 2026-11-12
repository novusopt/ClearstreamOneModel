"use client";

import { Headphones02, Palette, PauseCircle, PlayCircle } from "@untitledui/icons";
import { AnimatePresence, m, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { TajweedText } from "@/components/quran/tajweed-text";
import { rulesIn } from "@/components/quran/word";
import { useUi } from "@/components/providers/ui-messages";
import { fmt } from "@/lib/ui-format";
import type { Verse } from "@/lib/types";
import { cx } from "@/utils/cx";

/** Breath between ayat, after the last word's recited length. */
const AYAH_GAP = 650;

/**
 * Flattened word list with how long each word stays lit: Al-Husary's own pace, from one word's start to
 * the next (pauses included), so the light moves exactly as the recitation does.
 */
function useWordTrack(verses: Verse[]) {
  return useMemo(() => {
    const track: { vi: number; wi: number; ms: number; at: number }[] = [];
    let at = 0;
    for (const [vi, v] of verses.entries()) {
      for (const [wi, w] of v.w.entries()) {
        const next = v.w[wi + 1];
        const ms = Math.max(120, w.s != null && next?.s != null ? next.s - w.s : w.s != null && w.f != null ? w.f - w.s + AYAH_GAP : 650);
        track.push({ vi, wi, ms, at });
        at += ms;
      }
    }
    return track;
  }, [verses]);
}

/**
 * The hero's product shot: a live, miniature Mishkah reader playing Al-Fatihah. Words light up at the
 * real recitation pace and the word card follows. Purely illustrative: not focusable, described for
 * screen readers in one sentence.
 */
export function HeroShowcase({ verses }: { verses: Verse[] }) {
  const { m: t, fatihah } = useUi();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const track = useWordTrack(verses);
  // Start on a word in ayah 2 so a still frame (reduced motion, thumbnails) shows a lit word.
  const [pos, setPos] = useState(() => Math.max(0, track.findIndex((t) => t.vi === 1)));
  // Plays while on screen; the reader can pause it, and reduced motion leaves it paused until asked.
  const [paused, setPaused] = useState<boolean | null>(null);
  const playing = inView && track.length > 0 && (paused === null ? !reduce : !paused);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setPos((p) => (p + 1) % track.length), track[pos]?.ms ?? 650);
    return () => window.clearTimeout(id);
  }, [playing, pos, track]);

  const cur = track[pos] ?? { vi: 0, wi: 0 };
  const verse = verses[cur.vi];
  const word = verse?.w[cur.wi];
  const rules = word && typeof word.j !== "string" ? rulesIn(word.j) : [];
  const total = track.length ? track[track.length - 1].at + track[track.length - 1].ms : 1;
  const progress = track.length ? (track[pos].at + track[pos].ms) / total : 0;

  return (
    <div ref={ref} className="relative isolate mx-auto mt-16 max-w-6xl md:mt-20">
      {/* Lantern glow under the window */}
      <div aria-hidden="true" className="absolute inset-x-[12%] top-[8%] bottom-0 -z-10 rounded-full bg-gold-400/30 blur-3xl dark:bg-gold-500/15" />
      <p className="sr-only">{t.showcase.srOnly}</p>
      <div
        className="relative overflow-hidden rounded-2xl border border-secondary bg-primary text-left shadow-3xl ring-1 ring-black/5 md:rounded-3xl dark:ring-white/5"
      >
        {/* Surah progress along the top edge, at the recitation's pace. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-0.5 bg-secondary">
          <div className="h-full origin-left bg-gold-500 transition-transform duration-300 ease-linear" style={{ transform: `scaleX(${progress})` }} />
        </div>

        <div aria-hidden="true" className="grid lg:grid-cols-[1fr_17rem]">
          <div className="min-w-0">
            {/* Reader bar */}
            <div className="flex items-center gap-3 border-b border-secondary px-4 py-3 md:px-6">
              <span lang="ar" dir="rtl" className="font-quran text-xl text-brand-secondary">
                الفاتحة
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-sm font-semibold text-primary">Al-Fatihah</p>
                <p className="text-xs text-tertiary tabular-nums">
                  {fmt(t.showcase.position, { ayah: verse?.n ?? 1 })}
                </p>
              </div>
              <span className="ml-auto hidden sm:inline-flex">
                <BadgeWithIcon type="pill-color" color="brand" size="md" iconLeading={Headphones02}>
                  {t.showcase.listening}
                </BadgeWithIcon>
              </span>
              <span className="hidden md:inline-flex">
                <Badge type="modern" size="md">
                  {t.showcase.studyPreset}
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
                          "rounded-lg px-0.5 transition-colors duration-300 [box-decoration-break:clone]",
                          vi === cur.vi && wi === cur.wi ? "bg-gold-200/80 dark:bg-gold-500/30" : vi === cur.vi ? "bg-gold-50 dark:bg-gold-500/10" : "",
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
                <m.p
                  key={verse?.n}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="mx-auto max-w-xl text-sm text-tertiary md:text-md"
                >
                  {(verse && fatihah?.[verse.n - 1]) ?? verse?.en}
                </m.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Side panel: the word being recited */}
          <div className="hidden flex-col gap-3 border-l border-secondary bg-secondary/50 p-4 lg:flex">
            <p className="text-xs font-medium text-tertiary">{t.showcase.nowReciting}</p>
            <div className="rounded-xl border border-secondary bg-primary p-4 text-center shadow-xs">
              <m.div key={`${cur.vi}-${cur.wi}`} initial={{ opacity: 0.4, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                  <p lang="ar" dir="rtl" className="font-quran text-4xl leading-[1.8] text-primary">
                    {word && <TajweedText value={word.j} />}
                  </p>
                  <p className="font-display text-md text-gold-700 italic dark:text-gold-300">{word?.t}</p>
                  <p className="mt-0.5 text-sm text-secondary">{word?.e}</p>
              </m.div>
            </div>
            <div className="rounded-xl border border-secondary bg-primary p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-700 dark:text-gold-300">
                <Palette className="size-3.5" /> {t.showcase.tajweedInWord}
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
                  <li className="text-xs text-quaternary">{t.showcase.noRule}</li>
                )}
              </ul>
            </div>
            <div className="mt-auto rounded-xl border border-secondary bg-primary p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-secondary">{t.showcase.today}</span>
                <span className="text-tertiary tabular-nums">{fmt(t.showcase.ayatToday, { n: Math.round(progress * 7) })}</span>
              </div>
              <ProgressBarBase value={progress * 100} className="mt-2 h-1.5" progressClassName="duration-500" />
            </div>
          </div>
        </div>

        {/* Player: the one real control in the preview. */}
        <div className="flex items-center gap-3 border-t border-secondary bg-secondary/60 px-4 py-3 md:px-6">
          <ButtonUtility
            size="sm"
            color="tertiary"
            icon={playing ? PauseCircle : PlayCircle}
            tooltip={playing ? t.showcase.pause : t.showcase.play}
            onPress={() => setPaused(playing)}
            className="shrink-0 *:data-icon:size-6 *:data-icon:text-fg-brand-primary"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold text-secondary">Mahmoud Khalil Al-Husary</span>
              <span className="hidden text-tertiary sm:inline">{t.showcase.synced}</span>
            </div>
            <ProgressBarBase value={progress * 100} className="mt-1.5 h-1" progressClassName="bg-gold-500 duration-500" />
          </div>
          <span className="flex h-5 items-end gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cx("w-1 origin-bottom rounded-full bg-fg-brand-secondary motion-reduce:animate-none", playing ? "animate-equalizer" : "scale-y-50")}
                style={{ height: "100%", animationDelay: `${i * -0.25}s` }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
