"use client";

import { Bookmark, BookmarkCheck, Copy01, Link01, PauseCircle, PlayCircle, Share07, Type01 } from "@untitledui/icons";
import { motion } from "motion/react";
import { memo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dropdown } from "@/components/base/dropdown/dropdown";
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

  const arabic = verse.w.map((w) => w.a).join(" ");
  const text = translation ?? verse.en;
  const link = () => `${window.location.origin}/surah/${surah}#v-${verse.n}`;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(label);
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${surahName} ${key}`, text, url: link() }).catch(() => undefined);
    } else {
      await copy(link(), "Link copied");
    }
  };

  const onMenu = (action: string) => {
    if (action === "copy-verse") void copy(`${arabic}\n\n${text}\n\n— ${surahName} ${key}`, `Copied ${key}`);
    if (action === "copy-arabic") void copy(arabic, "Arabic text copied");
    if (action === "copy-link") void copy(link(), "Link copied");
    if (action === "share") void share();
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
        "group/verse relative scroll-mt-36 border-b border-secondary px-4 py-7 transition-colors duration-500 last:border-b-0 sm:px-8 sm:py-9",
        isCurrent ? "bg-brand-primary/50" : "hover:bg-secondary/40",
      )}
    >
      {isCurrent && <motion.span layoutId={`verse-indicator-${surah}`} className="absolute inset-y-0 left-0 w-0.5 bg-brand-solid" />}
      <div className="mb-5 flex items-center justify-between gap-2">
        <Badge type="pill-color" color="brand" size="lg" className="min-w-14 justify-center rounded-t-full rounded-b-md pt-2 font-display tabular-nums">
          {key}
        </Badge>
        <div className="flex items-center gap-0.5">
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
            className={cx(bookmarked && "text-fg-brand-primary")}
            onPress={() => {
              const added = toggleBookmark(surah, verse.n);
              toast(added ? `Bookmarked ${key}` : `Removed bookmark ${key}`);
            }}
          />
          <Dropdown.Root>
            <Dropdown.DotsButton className="ml-1 p-1.5" />
            <Dropdown.Popover className="w-56">
              <Dropdown.Menu onAction={(k) => onMenu(String(k))} aria-label={`Actions for ayah ${key}`}>
                <Dropdown.Section>
                  <Dropdown.Item id="copy-verse" icon={Copy01} label="Copy verse" />
                  <Dropdown.Item id="copy-arabic" icon={Type01} label="Copy Arabic only" />
                  <Dropdown.Item id="copy-link" icon={Link01} label="Copy link" />
                </Dropdown.Section>
                <Dropdown.Separator />
                <Dropdown.Section>
                  <Dropdown.Item id="share" icon={Share07} label="Share…" />
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
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
