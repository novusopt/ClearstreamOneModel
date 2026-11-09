"use client";

import { Fragment, useCallback, useEffect, useMemo } from "react";
import { scrollToElement, useLenis } from "@/components/providers/smooth-scroll";
import { Basmala } from "@/components/quran/basmala";
import { HifzPanel } from "@/components/quran/hifz-panel";
import { JuzDivider } from "@/components/quran/juz-divider";
import { ReaderBar } from "@/components/quran/reader-bar";
import { ReaderTips } from "@/components/quran/reader-tips";
import { ReadingView } from "@/components/quran/reading-view";
import { ResumeBanner } from "@/components/quran/resume-banner";
import { SurahEnd } from "@/components/quran/surah-end";
import { useTranslationText } from "@/components/quran/use-translation";
import { VerseCard } from "@/components/quran/verse-card";
import { VerseDialogs } from "@/components/quran/verse-dialogs";
import { player, playerStore } from "@/lib/audio-engine";
import { isSajdah, juzStartingAt, TRANSLATIONS } from "@/lib/constants";
import { setLastRead } from "@/lib/library";
import { positionStore } from "@/lib/reader-position";
import { setSettings, settingsStore, useSettings } from "@/lib/settings";
import { dataUrl, pickSurah } from "@/lib/data-urls";
import type { AudioVerse, Chapter, SimilarRef, Verse } from "@/lib/types";
import { useProgressiveCount } from "@/lib/use-progressive";
import { useRemote } from "@/lib/use-remote";

interface SurahReaderProps {
  chapter: Chapter;
  verses: Verse[];
  prev: Chapter | null;
  next: Chapter | null;
  /** Ayah 1:1 — the Basmala shown at the top of every surah except 1 and 9. */
  basmala: Verse;
}

export function SurahReader({ chapter, verses, prev, next, basmala }: SurahReaderProps) {
  const lenis = useLenis();
  const viewMode = useSettings((s) => s.viewMode);
  const lang = useSettings((s) => s.translation);
  const { texts } = useTranslationText(chapter.id, lang);
  const similarRaw = useRemote<unknown>(dataUrl.similar(chapter.id));
  const similar = similarRaw ? pickSurah<Record<string, SimilarRef[]>>("similar", similarRaw, chapter.id) : null;
  const rtl = TRANSLATIONS.find((t) => t.id === lang)?.rtl ?? false;
  const { count, ensure, done } = useProgressiveCount(verses.length);
  const shown = useMemo(() => verses.slice(0, count), [verses, count]);
  /** Render up to ayah `n`, then run `then` once it is in the DOM. */
  const reveal = useCallback(
    (n: number, then: () => void) => {
      ensure(n);
      requestAnimationFrame(() => requestAnimationFrame(then));
    },
    [ensure],
  );

  const audioVerses = useMemo<AudioVerse[]>(
    () => verses.map((v) => ({ n: v.n, g: v.g, t: v.w.map((w) => (w.s != null && w.f != null ? [w.s, w.f] : null)) })),
    [verses],
  );

  const playFrom = useCallback(
    (index: number) => player.play(chapter.id, chapter.nameSimple, audioVerses, index),
    [chapter.id, chapter.nameSimple, audioVerses],
  );

  // Follow the recitation: scroll the active ayah into view.
  useEffect(() => {
    let lastKey = "";
    return playerStore.subscribe(() => {
      const { surah, index, status, verses: pv } = playerStore.get();
      if (surah !== chapter.id || status === "idle") return;
      const key = `${surah}:${index}`;
      if (key === lastKey) return;
      lastKey = key;
      setLastRead(chapter.id, pv[index].n);
      if (!settingsStore.get().autoScroll) return;
      const n = pv[index].n;
      reveal(n, () => {
        const el = document.getElementById(`v-${n}`);
        if (el) scrollToElement(lenis, el, -160);
      });
    });
  }, [chapter.id, lenis, reveal]);

  // Deep links (#v-N): re-align once fonts and translations have settled, since the browser's
  // initial jump happens before the page finishes laying out.
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const go = () => {
      const m = window.location.hash.match(/^#v-(\d+)$/);
      if (!m) return;
      const n = Number(m[1]);
      const align = () => {
        const el = document.getElementById(`v-${n}`);
        if (el && !cancelled) scrollToElement(lenis, el, -150);
      };
      // Long surahs render progressively: make sure the target ayah exists first.
      ensure(n);
      void document.fonts.ready.then(() => timers.push(window.setTimeout(align, 250)));
      timers.push(window.setTimeout(align, 1200));
    };
    go();
    window.addEventListener("hashchange", go);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("hashchange", go);
    };
  }, [chapter.id, lenis, ensure]);

  // Keyboard: Space play/pause, J next ayah, K previous ayah.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest("input, textarea, select, [role=dialog], [role=menu], [contenteditable=true]")) return;
      const active = playerStore.get().surah === chapter.id;
      if (e.key === " " && !t?.closest("button, a")) {
        e.preventDefault();
        if (active) player.toggle();
        else playFrom(0);
      } else if (active && e.key.toLowerCase() === "j") player.next();
      else if (active && e.key.toLowerCase() === "k") player.prev();
      else if (e.key.toLowerCase() === "t") setSettings({ tajweed: !settingsStore.get().tajweed });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chapter.id, playFrom]);

  // Remember the ayah the reader is looking at.
  useEffect(() => {
    // An ayah counts as read once it has sat on the reading line for a moment, so fast scrolling
    // doesn't inflate progress.
    const els = document.querySelectorAll<HTMLElement>("[data-ayah]");
    const timers = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const ayah = Number(e.target.getAttribute("data-ayah"));
            positionStore.set({ surah: chapter.id, ayah });
            timers.set(e.target, window.setTimeout(() => setLastRead(chapter.id, ayah), 1200));
          } else {
            window.clearTimeout(timers.get(e.target));
            timers.delete(e.target);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
    // Re-observe as more ayat render.
  }, [chapter.id, viewMode, count]);

  const pageList = useMemo(() => verses.map((v) => v.p), [verses]);
  const togglePlay = () => (playerStore.get().surah === chapter.id ? player.toggle() : playFrom(0));
  const resume = (ayah: number) =>
    reveal(ayah, () => {
      const el = document.getElementById(`v-${ayah}`);
      if (el) scrollToElement(lenis, el, -150);
    });

  return (
    <div className="mx-auto max-w-5xl px-3 pb-40 sm:px-6 md:pb-24">
      <ReaderBar chapter={chapter} onPlay={togglePlay} pages={pageList} />
      <ResumeBanner surah={chapter.id} total={chapter.versesCount} onResume={resume} />
      <ReaderTips />

      {viewMode === "hifz" && (
        <HifzPanel chapter={chapter} onRepeat={(from, to, times) => player.playRange(chapter.id, chapter.nameSimple, audioVerses, from, to, times)} />
      )}

      {viewMode === "reading" ? (
        <ReadingView verses={shown} surah={chapter.id} basmala={<Basmala basmala={basmala} surah={chapter.id} variant="page" />} />
      ) : (
        <>
        <Basmala basmala={basmala} surah={chapter.id} />
        <div className="rounded-3xl border border-secondary bg-primary shadow-xs [&>*:first-child]:rounded-t-3xl [&>*:last-child]:rounded-b-3xl">
          {shown.map((v, i) => {
            const juz = juzStartingAt(chapter.id, v.n);
            return (
              <Fragment key={v.n}>
                {juz && <JuzDivider juz={juz} />}
                <VerseCard
                  verse={v}
                  index={i}
                  surah={chapter.id}
                  surahName={chapter.nameSimple}
                  translation={texts ? texts[i] : lang === "en" ? v.en : null}
                  translationRtl={rtl}
                  sajdah={isSajdah(chapter.id, v.n)}
                  similar={similar?.[v.n]}
                  onPlay={playFrom}
                />
              </Fragment>
            );
          })}
        </div>
        </>
      )}

      {!done && (
        <div className="flex justify-center py-8" aria-live="polite">
          <span className="text-sm text-tertiary">Loading ayat {count + 1}–{verses.length}…</span>
        </div>
      )}
      <VerseDialogs />
      {done && <SurahEnd chapter={chapter} prev={prev} next={next} />}
    </div>
  );
}
