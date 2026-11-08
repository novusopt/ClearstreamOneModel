"use client";

import { BRAND } from "@/lib/brand";
import { TOTAL_AYAT } from "@/lib/constants";
import { createStore, useStore } from "@/lib/create-store";

export interface ReadingPlan {
  /** Days to complete a full reading (khatm). */
  days: number;
  /** ISO date (YYYY-MM-DD) the plan started. */
  start: string;
}

export interface Note {
  text: string;
  at: number;
}

export interface LibraryState {
  /** Bookmarked ayat as "surah:ayah" keys, newest first. */
  bookmarks: string[];
  lastRead: { surah: number; ayah: number; at: number } | null;
  /** Personal reflections keyed by "surah:ayah". */
  notes: Record<string, Note>;
  /** Ayat marked as memorised ("surah:ayah"). */
  memorised: string[];
  /** Ayat read at least once, per surah (ayah numbers). */
  read: Record<string, number[]>;
  /** Ayat read per day, keyed by local ISO date. */
  log: Record<string, number>;
  plan: ReadingPlan | null;
}

const INITIAL: LibraryState = { bookmarks: [], lastRead: null, notes: {}, memorised: [], read: {}, log: {}, plan: null };

export const libraryStore = createStore<LibraryState>(INITIAL, `${BRAND.storagePrefix}:library:v1`);

export function useLibrary<S>(selector: (s: LibraryState) => S): S {
  return useStore(libraryStore, selector, INITIAL);
}

export const verseKey = (surah: number, ayah: number) => `${surah}:${ayah}`;

export function today(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toggleBookmark(surah: number, ayah: number): boolean {
  const key = verseKey(surah, ayah);
  const has = libraryStore.get().bookmarks.includes(key);
  libraryStore.set((s) => ({ bookmarks: has ? s.bookmarks.filter((k) => k !== key) : [key, ...s.bookmarks] }));
  return !has;
}

/** Records the ayah the reader is on: last-read position, per-surah progress and the daily log. */
export function setLastRead(surah: number, ayah: number) {
  const s = libraryStore.get();
  if (s.lastRead && s.lastRead.surah === surah && s.lastRead.ayah === ayah) return;
  const seen = s.read[surah] ?? [];
  const isNew = !seen.includes(ayah);
  const day = today();
  libraryStore.set({
    lastRead: { surah, ayah, at: Date.now() },
    ...(isNew && {
      read: { ...s.read, [surah]: [...seen, ayah] },
      log: { ...s.log, [day]: (s.log[day] ?? 0) + 1 },
    }),
  });
}

export function saveNote(surah: number, ayah: number, text: string) {
  const key = verseKey(surah, ayah);
  libraryStore.set((s) => {
    const notes = { ...s.notes };
    if (text.trim()) notes[key] = { text: text.trim(), at: Date.now() };
    else delete notes[key];
    return { notes };
  });
}

export function toggleMemorised(surah: number, ayah: number): boolean {
  const key = verseKey(surah, ayah);
  const has = libraryStore.get().memorised.includes(key);
  libraryStore.set((s) => ({ memorised: has ? s.memorised.filter((k) => k !== key) : [...s.memorised, key] }));
  return !has;
}

export function startPlan(days: number) {
  libraryStore.set({ plan: { days, start: today() } });
}

export function stopPlan() {
  libraryStore.set({ plan: null });
}

/** Total distinct ayat read. */
export function totalRead(read: LibraryState["read"]): number {
  return Object.values(read).reduce((n, list) => n + list.length, 0);
}

/** Consecutive days with reading, ending today (or yesterday if nothing yet today). */
export function streak(log: LibraryState["log"]): number {
  const d = new Date();
  if (!log[today(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (log[today(d)]) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function planStatus(plan: ReadingPlan, state: Pick<LibraryState, "read" | "log">) {
  const daily = Math.ceil(TOTAL_AYAT / plan.days);
  const start = new Date(`${plan.start}T00:00:00`);
  const dayIndex = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
  const done = totalRead(state.read);
  // Pace is judged against the days already finished; today's portion is still in progress.
  const expected = Math.min(TOTAL_AYAT, daily * dayIndex);
  return { daily, day: Math.min(dayIndex + 1, plan.days), todayCount: state.log[today()] ?? 0, done, expected, ahead: done - expected };
}
