"use client";

import { DEFAULT_RECITER } from "@/lib/constants";
import { BRAND } from "@/lib/brand";
import { createStore, useStore } from "@/lib/create-store";

export interface ReaderSettings {
  viewMode: "verse" | "reading" | "hifz";
  translation: string;
  showTranslation: boolean;
  showTransliteration: boolean;
  /** Inline word-by-word glosses under each Arabic word. */
  wordByWord: boolean;
  wbwTransliteration: boolean;
  tajweed: boolean;
  arabicSize: number;
  translationSize: number;
  reciter: string;
  playbackRate: number;
  autoScroll: boolean;
  repeat: "off" | "ayah" | "surah";
  /** First-visit reader tips have been dismissed. */
  seenTips: boolean;
  /** Show the tafsir (Al-Mukhtasar) under every ayah instead of on demand. */
  tafsirOpen: boolean;
  /** Tafsir language: "auto" follows the translation (English fallback). */
  tafsirLang: string;
  /** Memorise mode: which words are hidden. */
  hifzHide: "all" | "alternate" | "half" | "first-letter";
  /** Teaching pause after each ayah: 0 = off, -1 = as long as the ayah, else seconds. */
  pauseAfter: number;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  viewMode: "verse",
  translation: "en",
  showTranslation: true,
  showTransliteration: false,
  wordByWord: false,
  wbwTransliteration: true,
  tajweed: true,
  arabicSize: 3,
  translationSize: 2,
  reciter: DEFAULT_RECITER,
  playbackRate: 1,
  autoScroll: true,
  repeat: "off",
  seenTips: false,
  tafsirOpen: false,
  tafsirLang: "auto",
  hifzHide: "all",
  pauseAfter: 0,
};

export const settingsStore = createStore<ReaderSettings>(DEFAULT_SETTINGS, `${BRAND.storagePrefix}:settings:v1`);

export function useSettings<S>(selector: (s: ReaderSettings) => S): S {
  return useStore(settingsStore, selector, DEFAULT_SETTINGS);
}

export const setSettings = settingsStore.set;

/** Arabic text sizes, steps 1–6. */
export const ARABIC_SIZES = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];
export const TRANSLATION_SIZES = ["text-sm", "text-md", "text-lg", "text-xl", "text-display-xs"];

/** One-tap display presets for the layers shown around the Arabic text. */
export type DisplayPreset = "read" | "study" | "arabic";

export const DISPLAY_PRESETS: Record<DisplayPreset, { label: string; description: string; settings: Partial<ReaderSettings> }> = {
  read: {
    label: "Read",
    description: "Arabic with translation",
    settings: { showTranslation: true, wordByWord: false, showTransliteration: false, tafsirOpen: false },
  },
  study: {
    label: "Study",
    description: "Word meanings, transliteration and tafsir",
    settings: { showTranslation: true, wordByWord: true, wbwTransliteration: true, showTransliteration: true, tafsirOpen: true },
  },
  arabic: {
    label: "Arabic only",
    description: "Just the Qurʾānic text",
    settings: { showTranslation: false, wordByWord: false, showTransliteration: false, tafsirOpen: false },
  },
};

export function currentPreset(s: ReaderSettings): DisplayPreset | null {
  for (const [id, p] of Object.entries(DISPLAY_PRESETS) as Array<[DisplayPreset, (typeof DISPLAY_PRESETS)[DisplayPreset]]>) {
    if (Object.entries(p.settings).every(([k, v]) => s[k as keyof ReaderSettings] === v)) return id;
  }
  return null;
}

export const applyPreset = (id: DisplayPreset) => settingsStore.set(DISPLAY_PRESETS[id].settings);
