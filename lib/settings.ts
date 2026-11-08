"use client";

import { DEFAULT_RECITER } from "@/lib/constants";
import { createStore, useStore } from "@/lib/create-store";

export interface ReaderSettings {
  viewMode: "verse" | "reading";
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
};

export const settingsStore = createStore<ReaderSettings>(DEFAULT_SETTINGS, "noor:settings:v1");

export function useSettings<S>(selector: (s: ReaderSettings) => S): S {
  return useStore(settingsStore, selector, DEFAULT_SETTINGS);
}

export const setSettings = settingsStore.set;

/** Arabic text sizes, steps 1–6. */
export const ARABIC_SIZES = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];
export const TRANSLATION_SIZES = ["text-sm", "text-md", "text-lg", "text-xl", "text-display-xs"];
