"use client";

import { createStore, useStore } from "@/lib/create-store";

export interface LibraryState {
  /** Bookmarked ayat as "surah:ayah" keys, newest first. */
  bookmarks: string[];
  lastRead: { surah: number; ayah: number; at: number } | null;
}

const INITIAL: LibraryState = { bookmarks: [], lastRead: null };

export const libraryStore = createStore<LibraryState>(INITIAL, "noor:library:v1");

export function useLibrary<S>(selector: (s: LibraryState) => S): S {
  return useStore(libraryStore, selector, INITIAL);
}

export const verseKey = (surah: number, ayah: number) => `${surah}:${ayah}`;

export function toggleBookmark(surah: number, ayah: number): boolean {
  const key = verseKey(surah, ayah);
  const has = libraryStore.get().bookmarks.includes(key);
  libraryStore.set((s) => ({ bookmarks: has ? s.bookmarks.filter((k) => k !== key) : [key, ...s.bookmarks] }));
  return !has;
}

export function setLastRead(surah: number, ayah: number) {
  const cur = libraryStore.get().lastRead;
  if (cur && cur.surah === surah && cur.ayah === ayah) return;
  libraryStore.set({ lastRead: { surah, ayah, at: Date.now() } });
}
