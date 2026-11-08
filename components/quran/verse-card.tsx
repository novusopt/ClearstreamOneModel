"use client";

import { Bookmark, BookmarkCheck, Copy01, PauseCircle, PlayCircle, Share07 } from "@untitledui/icons";
import { motion } from "motion/react";
import { memo } from "react";
import { toast } from "sonner";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Word } from "@/components/quran/word";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { player, usePlayer, useTick } from "@/lib/audio-engine";
import { toggleBookmark, useLibrary, verseKey } from "@/lib/library";
import { ARABIC_SIZES, TRANSLATION_SIZES, useSettings } from "@/lib/settings";
import type { Verse } from "@/lib/types";
import { cx } from "@/utils/cx";

interface VerseCardProps {
  verse: Verse;
  index: number;
  surah: number;
  surahName: string;
  translation: string | null;
  translationRtl: boolean;
  onPlay: (index: number) => void;
}

export const VerseCard = memo(function VerseCard({ verse, index, surah, surahName, translation, translationRtl, onPlay }: VerseCardProps) {
  const isCurrent = usePlayer((s) => s.surah === surah && s.index === index && s.status !== "idle");
  const isPlaying = usePlayer((s) => s.surah === surah && s.index === index && (s.status === "playing" || s.status === "loading"));
  const activeWord = useTick((s) => (isCurrent ? s.word : -1));
  const bookmarked = useLibrary((s) => s.bookmarks.includes(verseKey(surah, verse.n)));

  const tajweed = useSettings((s) => s.tajweed);
  const wordByWord = useSettings((s) => s.wordByWord);
  const wbwTransliteration = useSettings((s) => s.wbwTransliteration);
  const showTranslation = useSettings((s) => s.showTranslation);
  const showTransliteration = useSettings((s) => s.showTransliteration);
  const arabicSize = useSettings((s) => ARABIC_SIZES[s.arabicSize - 1] ?? ARABIC_SIZES[2]);
  const translationSize = useSettings((s) => TRANSLATION_SIZES[s.translationSize - 1] ?? TRANSLATION_SIZES[1]);

  const key = verseKey(surah, verse.n);

  const copy = async () => {
    const text = `${verse.w.map((w) => w.a).join(" ")}\n\n${translation ?? verse.en}\n\n— ${surahName} ${key}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${key}`);
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/surah/${surah}#v-${verse.n}`;
    if (navigator.share) {
      await navigator.share({ title: `${surahName} ${key}`, text: translation ?? verse.en, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast.success("Link copied");
    }
  };

  return (
    <motion.article
      id={`v-${verse.n}`}
      data-ayah={verse.n}
      aria-label={`Ayah ${key}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cx(
        "group/verse relative scroll-mt-36 rounded-3xl border p-4 transition-[background-color,border-color,box-shadow] duration-500 sm:p-6 md:p-8",
        isCurrent
          ? "border-brand bg-brand-primary/40 shadow-[0_0_0_6px] shadow-brand-500/10"
          : "border-secondary bg-primary hover:shadow-md",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="inline-flex h-7 min-w-12 items-center justify-center rounded-full bg-secondary px-2.5 text-xs font-semibold text-secondary tabular-nums ring-1 ring-secondary">
          {key}
        </span>
        <div className="flex items-center gap-0.5 opacity-100 transition-opacity duration-300 md:opacity-60 md:group-hover/verse:opacity-100 md:group-focus-within/verse:opacity-100">
          <ButtonUtility
            size="sm"
            color="tertiary"
            tooltip={isPlaying ? "Pause" : "Play from here"}
            icon={isPlaying ? PauseCircle : PlayCircle}
            onPress={() => (isCurrent ? player.toggle() : onPlay(index))}
          />
          <ButtonUtility
            size="sm"
            color="tertiary"
            tooltip={bookmarked ? "Remove bookmark" : "Bookmark"}
            icon={bookmarked ? BookmarkCheck : Bookmark}
            className={cx(bookmarked && "text-brand-secondary")}
            onPress={() => {
              const added = toggleBookmark(surah, verse.n);
              toast(added ? `Bookmarked ${key}` : `Removed bookmark ${key}`);
            }}
          />
          <ButtonUtility size="sm" color="tertiary" tooltip="Copy" icon={Copy01} onPress={copy} />
          <ButtonUtility size="sm" color="tertiary" tooltip="Share" icon={Share07} onPress={share} />
        </div>
      </div>

      <div className="space-y-5">
          <div dir="rtl" lang="ar" className="flex flex-wrap items-end gap-x-1 gap-y-3">
            {verse.w.map((w, i) => (
              <Word
                key={i}
                word={w}
                surah={surah}
                ayah={verse.n}
                index={i}
                tajweed={tajweed}
                wordByWord={wordByWord}
                wbwTransliteration={wbwTransliteration}
                active={activeWord === i}
                sizeClass={arabicSize}
              />
            ))}
            <AyahMarker n={verse.n} className={cx(arabicSize, "self-center")} />
          </div>

          {showTransliteration && <p className="text-sm text-brand-tertiary italic md:text-md">{verse.tr}</p>}

          {showTranslation && (
            <p
              dir={translationRtl ? "rtl" : "ltr"}
              className={cx("leading-relaxed text-secondary", translationSize, translation == null && "animate-pulse")}
            >
              {translation ?? verse.en}
            </p>
          )}
      </div>
    </motion.article>
  );
});
