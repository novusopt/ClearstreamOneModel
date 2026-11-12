"use client";

import { Bookmark, BookmarkCheck, CheckCircle, DotsVertical, Copy01, Edit05, Eye, EyeOff, Image01, Link01, PauseCircle, PlayCircle, Share07, Type01 } from "@untitledui/icons";
import { m } from "motion/react";
import { memo, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { notify } from "@/components/application/notifications/notification";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { quarterLabel } from "@/components/quran/hizb-mark";
import { TafsirSection } from "@/components/quran/tafsir-section";
import { Word } from "@/components/quran/word";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { VerseNumber } from "@/components/quran/verse-number";
import { openVerseDialog } from "@/components/quran/verse-dialogs";
import { player, usePlayer, useTick } from "@/lib/audio-engine";
import { toggleBookmark, toggleMemorised, useLibrary, verseKey } from "@/lib/library";
import { ARABIC_SIZES, TRANSLATION_SIZES, useSettings } from "@/lib/settings";
import type { Verse } from "@/lib/types";
import { ayahPath } from "@/lib/site";
import { cx } from "@/utils/cx";

interface VerseCardProps {
  verse: Verse;
  index: number;
  surah: number;
  surahName: string;
  translation: string | null;
  translationRtl: boolean;
  /** Ayah of prostration (۩). */
  sajdah?: boolean;
  onPlay: (index: number) => void;
}

export const VerseCard = memo(function VerseCard({ verse, index, surah, surahName, translation, translationRtl, sajdah = false, onPlay }: VerseCardProps) {
  const isCurrent = usePlayer((s) => s.surah === surah && s.index === index && s.status !== "idle");
  const isPlaying = usePlayer((s) => s.surah === surah && s.index === index && (s.status === "playing" || s.status === "loading" || s.status === "repeat"));
  const activeWord = useTick((s) => (isCurrent ? s.word : -1));
  const bookmarked = useLibrary((s) => s.bookmarks.includes(verseKey(surah, verse.n)));
  const note = useLibrary((s) => s.notes[verseKey(surah, verse.n)]?.text ?? null);
  const memorised = useLibrary((s) => s.memorised.includes(verseKey(surah, verse.n)));
  const hifz = useSettings((s) => s.viewMode === "hifz");
  // Memorisation mode: words stay hidden until revealed (one tap per word, or all at once).
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const hideMode = useSettings((s) => s.hifzHide);
  // Which words start hidden in Memorise mode (progressive hiding, as huffaz are taught).
  const hiddenByMode = (i: number) =>
    hideMode === "alternate" ? i % 2 === 1 : hideMode === "half" ? i >= Math.ceil(verse.w.length / 2) : true;
  const isConcealed = (i: number) => hifz && hiddenByMode(i) && !revealed.has(i);
  const allRevealed = verse.w.every((_, i) => !isConcealed(i));
  const reveal = (i: number) => setRevealed((prev) => new Set(prev).add(i));

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
      notify.success(label, { id: "clipboard" });
    } catch {
      notify.error("Couldn't copy", { description: "Your browser blocked clipboard access. Select the text and copy it instead." });
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
    const target = { surah, ayah: verse.n, surahName, arabic, translation: text };
    if (action === "note") openVerseDialog(target, "note");
    if (action === "image") openVerseDialog(target, "image");
    if (action === "memorised") {
      const added = toggleMemorised(surah, verse.n);
      if (added) notify.success(`Ayah ${key} memorised`, { id: `mem-${key}`, description: "Keep going: it's added to your Library." });
      else notify.neutral(`Removed ${key} from memorised`, { id: `mem-${key}` });
    }
  };

  return (
    <m.article
      id={`v-${verse.n}`}
      data-ayah={verse.n}
      aria-label={`Ayah ${key}`}
      initial={{ y: 18 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cx(
        "group/verse relative scroll-mt-36 border-b border-secondary px-4 py-5 transition-colors duration-500 last:border-b-0 sm:px-8 sm:py-6",
        isCurrent ? "bg-brand-primary/50 dark:bg-brand-900/25" : "hover:bg-secondary/40",
      )}
    >
      {isCurrent && <m.span layoutId={`verse-indicator-${surah}`} className="absolute inset-y-0 left-0 w-0.5 bg-brand-solid" />}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <VerseNumber compact surah={surah} ayah={verse.n} active={isCurrent} playing={isPlaying} href={ayahPath(surah, verse.n)} />
          {verse.q && (
            <Badge type="pill-color" color="warning" size="sm" className="gap-1">
              <span aria-hidden="true">۞</span> {quarterLabel(verse.q)}
            </Badge>
          )}
          {sajdah && (
            <Tooltip title="Ayah of prostration" description="It is recommended to prostrate (sajdat at-tilāwah) after reciting this ayah." placement="top">
              <TooltipTrigger className="rounded-full">
                <Badge type="pill-color" color="warning" size="sm" className="gap-1">
                  <span aria-hidden="true">۩</span> Sajdah
                </Badge>
              </TooltipTrigger>
            </Tooltip>
          )}
          {memorised && (
            <BadgeWithIcon type="pill-color" color="success" size="sm" iconLeading={CheckCircle}>
              Memorised
            </BadgeWithIcon>
          )}
        </div>
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
              if (added)
                notify.success(`Bookmarked ${surahName} ${key}`, {
                  id: `bm-${key}`,
                  icon: BookmarkCheck,
                  action: { label: "Undo", onPress: () => toggleBookmark(surah, verse.n) },
                });
              else
                notify.neutral(`Bookmark removed`, {
                  id: `bm-${key}`,
                  icon: Bookmark,
                  action: { label: "Undo", onPress: () => toggleBookmark(surah, verse.n) },
                });
            }}
          />
          <Dropdown.Root>
            <ButtonUtility size="sm" color="tertiary" tooltip={`More actions for ${key}`} icon={DotsVertical} />
            <Dropdown.Popover className="w-56">
              <Dropdown.Menu onAction={(k) => onMenu(String(k))} aria-label={`Actions for ayah ${key}`}>
                <Dropdown.Section>
                  <Dropdown.Item id="copy-verse" icon={Copy01} label="Copy verse" />
                  <Dropdown.Item id="copy-arabic" icon={Type01} label="Copy Arabic only" />
                  <Dropdown.Item id="copy-link" icon={Link01} label="Copy link" />
                </Dropdown.Section>
                <Dropdown.Separator />
                <Dropdown.Section>
                  <Dropdown.Item id="note" icon={Edit05} label={note ? "Edit note" : "Add note"} />
                  <Dropdown.Item id="memorised" icon={CheckCircle} label={memorised ? "Unmark memorised" : "Mark as memorised"} />
                </Dropdown.Section>
                <Dropdown.Separator />
                <Dropdown.Section>
                  <Dropdown.Item id="image" icon={Image01} label="Share as image" />
                  <Dropdown.Item id="share" icon={Share07} label="Share link…" />
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        </div>
      </div>

      <div className="space-y-4">
          <div dir="rtl" lang="ar" className="flex flex-wrap items-start gap-x-1 gap-y-3">
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
                concealed={isConcealed(i)}
                hint={hideMode === "first-letter"}
                onReveal={reveal}
              />
            ))}
            {/* Same box as a word's text (top padding + Qurʾān font line box) so the marker shares the words' baseline. */}
            <span className={cx("font-quran pt-1", arabicSize)}>
              <AyahMarker n={verse.n} active={isPlaying} />
            </span>
          </div>

          {hifz && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                color="secondary"
                iconLeading={allRevealed ? EyeOff : Eye}
                onPress={() => setRevealed(allRevealed ? new Set() : new Set(verse.w.map((_, i) => i)))}
              >
                {allRevealed ? "Hide again" : "Reveal ayah"}
              </Button>
              <Button
                size="sm"
                color={memorised ? "secondary" : "tertiary"}
                iconLeading={CheckCircle}
                onPress={() => onMenu("memorised")}
                className={cx(memorised && "text-success-primary")}
              >
                {memorised ? "Memorised" : "Mark memorised"}
              </Button>
              <span className="text-xs text-tertiary">Tap a blurred word to reveal it.</span>
            </div>
          )}

          {showTransliteration && (!hifz || allRevealed) && <p className="text-sm text-brand-tertiary italic md:text-md">{verse.tr}</p>}

          {showTranslation && (!hifz || allRevealed) && (
            <p
              dir={translationRtl ? "rtl" : "ltr"}
              className={cx("leading-relaxed text-secondary", translationSize, translation == null && "animate-pulse")}
            >
              {translation ?? verse.en}
            </p>
          )}

          {(!hifz || allRevealed) && <TafsirSection surah={surah} ayah={verse.n} />}

          {note && (
            <AriaButton
              onPress={() => onMenu("note")}
              className="flex w-full cursor-pointer gap-3 rounded-xl border border-gold-400/40 bg-gold-100/40 px-4 py-3 text-left text-sm text-secondary outline-focus-ring transition hover:bg-gold-100/70 focus-visible:outline-2 dark:bg-gold-500/10 dark:hover:bg-gold-500/15"
            >
              <Edit05 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-400" />
              <span className="min-w-0 flex-1 whitespace-pre-line">
                <span className="sr-only">Your note: </span>
                {note}
              </span>
            </AriaButton>
          )}
      </div>
    </m.article>
  );
});
