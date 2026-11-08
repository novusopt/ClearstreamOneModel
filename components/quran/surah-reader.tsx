"use client";

import { AlignJustify, ArrowLeft, ArrowRight, PauseCircle, PlayCircle, Rows01 } from "@untitledui/icons";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { scrollToElement, useLenis } from "@/components/providers/smooth-scroll";
import { ReaderSettings } from "@/components/quran/reader-settings";
import { ReadingView } from "@/components/quran/reading-view";
import { TajweedLegend } from "@/components/quran/tajweed-legend";
import { useTranslationText } from "@/components/quran/use-translation";
import { VerseCard } from "@/components/quran/verse-card";
import { player, playerStore, usePlayer } from "@/lib/audio-engine";
import { TRANSLATIONS } from "@/lib/constants";
import { setLastRead } from "@/lib/library";
import { setSettings, settingsStore, useSettings } from "@/lib/settings";
import type { AudioVerse, Chapter, Verse } from "@/lib/types";

interface SurahReaderProps {
  chapter: Chapter;
  verses: Verse[];
  prev: Chapter | null;
  next: Chapter | null;
}

export function SurahReader({ chapter, verses, prev, next }: SurahReaderProps) {
  const lenis = useLenis();
  const viewMode = useSettings((s) => s.viewMode);
  const lang = useSettings((s) => s.translation);
  const { texts } = useTranslationText(chapter.id, lang);
  const rtl = TRANSLATIONS.find((t) => t.id === lang)?.rtl ?? false;
  const isThisSurah = usePlayer((s) => s.surah === chapter.id);
  const isPlaying = usePlayer((s) => s.surah === chapter.id && (s.status === "playing" || s.status === "loading"));

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
      const el = document.getElementById(`v-${pv[index].n}`);
      if (el) scrollToElement(lenis, el, -160);
    });
  }, [chapter.id, lenis]);

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chapter.id, playFrom]);

  // Remember the ayah the reader is looking at.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-ayah]");
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setLastRead(chapter.id, Number(visible.target.getAttribute("data-ayah")));
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chapter.id, viewMode]);

  return (
    <div className="mx-auto max-w-5xl px-3 pb-24 sm:px-6">
      <div className="sticky top-3 z-30 mb-8 md:top-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex max-w-max items-center justify-center gap-2 rounded-2xl bg-primary/80 p-2 shadow-lg ring-1 ring-secondary_alt backdrop-blur-xl"
        >
          <Button
            size="sm"
            iconLeading={isPlaying ? PauseCircle : PlayCircle}
            onPress={() => (isThisSurah ? player.toggle() : playFrom(0))}
          >
            <span className="sm:hidden">{isPlaying ? "Pause" : "Play"}</span>
            <span className="hidden sm:inline">{isPlaying ? "Pause" : isThisSurah ? "Resume" : "Play surah"}</span>
          </Button>
          <ButtonGroup
            size="sm"
            selectedKeys={[viewMode]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const k = [...keys][0];
              if (k === "verse" || k === "reading") setSettings({ viewMode: k });
            }}
            aria-label="View mode"
          >
            <ButtonGroupItem id="verse" iconLeading={Rows01} aria-label="Verse by verse">
              <span className="hidden sm:inline">Verse</span>
            </ButtonGroupItem>
            <ButtonGroupItem id="reading" iconLeading={AlignJustify} aria-label="Reading mode">
              <span className="hidden sm:inline">Reading</span>
            </ButtonGroupItem>
          </ButtonGroup>
          <div className="hidden sm:block">
            <TajweedLegend compact />
          </div>
          <ReaderSettings />
        </motion.div>
      </div>

      {viewMode === "reading" ? (
        <ReadingView verses={verses} surah={chapter.id} />
      ) : (
        <div className="rounded-3xl border border-secondary bg-primary shadow-xs [&>article:first-child]:rounded-t-3xl [&>article:last-child]:rounded-b-3xl">
          {verses.map((v, i) => (
            <VerseCard
              key={v.n}
              verse={v}
              index={i}
              surah={chapter.id}
              surahName={chapter.nameSimple}
              translation={texts ? texts[i] : lang === "en" ? v.en : null}
              translationRtl={rtl}
              onPlay={playFrom}
            />
          ))}
        </div>
      )}

      <nav aria-label="Surah navigation" className="mt-16 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <SurahNavLink chapter={prev} direction="prev" />
        ) : (
          <span />
        )}
        {next && <SurahNavLink chapter={next} direction="next" />}
      </nav>
    </div>
  );
}

function SurahNavLink({ chapter, direction }: { chapter: Chapter; direction: "prev" | "next" }) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight;
  return (
    <Link
      href={`/surah/${chapter.id}`}
      className={`group flex items-center gap-4 rounded-2xl border border-secondary bg-primary p-5 outline-focus-ring transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg focus-visible:outline-2 ${direction === "next" ? "flex-row-reverse text-right sm:col-start-2" : ""}`}
    >
      <FeaturedIcon icon={Icon} color="brand" theme="light" size="md" className="transition group-hover:scale-110" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-tertiary">{direction === "prev" ? "Previous" : "Next"} surah</span>
        <span className="block truncate font-semibold text-primary">
          {chapter.id}. {chapter.nameSimple}
        </span>
      </span>
      <span lang="ar" dir="rtl" className="font-quran text-2xl text-secondary">
        {chapter.nameArabic}
      </span>
    </Link>
  );
}
