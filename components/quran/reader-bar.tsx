"use client";

import { AlignJustify, ChevronDown, Eye, GraduationHat01, PauseCircle, PlayCircle, Rows01, Settings04 } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { openReaderSettings, ReaderSettings } from "@/components/quran/reader-settings";
import { usePlayer } from "@/lib/audio-engine";
import { useChrome } from "@/lib/chrome";
import { juzOf } from "@/lib/constants";
import { useReaderPosition } from "@/lib/reader-position";
import { applyPreset, currentPreset, DISPLAY_PRESETS, type DisplayPreset, setSettings, useSettings } from "@/lib/settings";
import type { Chapter } from "@/lib/types";
import { cx } from "@/utils/cx";

/** Where am I: surah · ayah · juzʾ, following the reading line. */
function Position({ chapter }: { chapter: Chapter }) {
  const ayah = useReaderPosition((p) => (p.surah === chapter.id ? p.ayah : 0));
  return (
    <div className="hidden min-w-0 items-center gap-3 pl-2 lg:flex" aria-live="polite">
      <span lang="ar" dir="rtl" className="font-quran text-2xl leading-none text-brand-secondary">
        {chapter.nameArabic}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-primary">{chapter.nameSimple}</span>
        <span className="block h-4 overflow-hidden text-xs text-tertiary tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={ayah} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="block">
              {ayah ? `Ayah ${ayah} of ${chapter.versesCount} · Juzʾ ${juzOf(chapter.id, ayah)}` : `${chapter.versesCount} ayat · ${chapter.nameTranslation}`}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </div>
  );
}

function DisplayMenu() {
  const preset = useSettings(currentPreset);
  const tajweed = useSettings((s) => s.tajweed);
  return (
    <Dropdown.Root>
      <Button size="sm" color="secondary" iconLeading={Eye} iconTrailing={ChevronDown} aria-label="Display">
        <span className="hidden sm:inline">{preset ? DISPLAY_PRESETS[preset].label : "Custom"}</span>
      </Button>
      <Dropdown.Popover className="w-72" placement="bottom">
        <Dropdown.Menu aria-label="Display">
          <Dropdown.Section
            aria-label="Presets"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={preset ? [preset] : []}
            onSelectionChange={(keys) => {
              const k = [...keys][0];
              if (k) applyPreset(k as DisplayPreset);
            }}
          >
            <Dropdown.SectionHeader className="px-4 pt-2 pb-1 text-xs font-semibold text-quaternary">Show</Dropdown.SectionHeader>
            {(Object.keys(DISPLAY_PRESETS) as DisplayPreset[]).map((id) => (
              <Dropdown.Item key={id} id={id} textValue={DISPLAY_PRESETS[id].label} selectionIndicator="radio">
                <span className="flex flex-col whitespace-normal">
                  <span className="text-sm font-semibold text-primary">{DISPLAY_PRESETS[id].label}</span>
                  <span className="text-xs font-normal text-tertiary">{DISPLAY_PRESETS[id].description}</span>
                </span>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
          <Dropdown.Separator />
          <Dropdown.Section
            aria-label="Options"
            selectionMode="multiple"
            selectedKeys={tajweed ? ["tajweed"] : []}
            onSelectionChange={(keys) => setSettings({ tajweed: [...keys].includes("tajweed") })}
          >
            <Dropdown.Item id="tajweed" label="Tajweed colours" addon="T" selectionIndicator="toggle" />
          </Dropdown.Section>
          <Dropdown.Separator />
          <Dropdown.Section aria-label="More">
            <Dropdown.Item id="settings" icon={Settings04} label="All reading settings…" onAction={openReaderSettings} />
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

interface ReaderBarProps {
  chapter: Chapter;
  onPlay: () => void;
}

export function ReaderBar({ chapter, onPlay }: ReaderBarProps) {
  const viewMode = useSettings((s) => s.viewMode);
  const isThisSurah = usePlayer((s) => s.surah === chapter.id);
  const isPlaying = usePlayer((s) => s.surah === chapter.id && (s.status === "playing" || s.status === "loading"));
  const playerOpen = usePlayer((s) => s.surah != null);
  // When the site header slides back in, tuck the sticky bar beneath it instead of under it.
  const headerVisible = useChrome((c) => c.headerVisible);

  return (
    // Thumb-reach bar at the bottom on phones; sticky at the top on larger screens.
    <div
      className={cx(
        "fixed inset-x-0 z-30 px-3 transition-[bottom,top] duration-300 md:sticky md:bottom-auto md:mb-6 md:px-0",
        headerVisible ? "md:top-[5.5rem]" : "md:top-4",
        playerOpen ? "bottom-[calc(env(safe-area-inset-bottom,0px)+9.5rem)]" : "bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]",
      )}
    >
      <motion.div
        initial={{ y: -8 }}
        animate={{ y: 0 }}
        className="mx-auto flex max-w-max items-center justify-between gap-2 rounded-2xl bg-primary/85 p-2 shadow-lg ring-1 ring-secondary_alt backdrop-blur-xl md:max-w-none"
      >
        <Position chapter={chapter} />
        <div className="flex items-center gap-2">
          <Button size="sm" iconLeading={isPlaying ? PauseCircle : PlayCircle} onPress={onPlay}>
            <span className="sm:hidden">{isPlaying ? "Pause" : "Listen"}</span>
            <span className="hidden sm:inline">{isPlaying ? "Pause" : isThisSurah ? "Resume" : "Listen"}</span>
          </Button>
          <ButtonGroup
            size="sm"
            selectedKeys={[viewMode]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const k = [...keys][0];
              if (k === "verse" || k === "reading" || k === "hifz") setSettings({ viewMode: k });
            }}
            aria-label="View mode"
          >
            <ButtonGroupItem id="verse" iconLeading={Rows01} aria-label="Verse by verse">
              <span className="hidden xl:inline">Verses</span>
            </ButtonGroupItem>
            <ButtonGroupItem id="reading" iconLeading={AlignJustify} aria-label="Mushaf reading">
              <span className="hidden xl:inline">Mushaf</span>
            </ButtonGroupItem>
            <ButtonGroupItem id="hifz" iconLeading={GraduationHat01} aria-label="Memorise">
              <span className="hidden xl:inline">Memorise</span>
            </ButtonGroupItem>
          </ButtonGroup>
          <DisplayMenu />
          <ReaderSettings className="hidden sm:inline-flex" />
        </div>
      </motion.div>
    </div>
  );
}
