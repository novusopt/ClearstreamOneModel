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

/** Spaced-repetition state for a memorised ayah (SM-2 style). */
export interface Review {
  /** Current interval in days. */
  i: number;
  /** Next review date (local ISO date). */
  due: string;
  /** Successful reviews in a row. */
  n: number;
  /** Ease factor. */
  e: number;
}

export type Grade = "again" | "hard" | "good" | "easy";

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
  /** Review schedule for memorised ayat. */
  reviews: Record<string, Review>;
  /** When all surahs were last saved for offline reading. */
  offlineAt: number | null;
}

const INITIAL: LibraryState = { bookmarks: [], lastRead: null, notes: {}, memorised: [], read: {}, log: {}, plan: null, reviews: {}, offlineAt: null };

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

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return today(d);
}

export function toggleMemorised(surah: number, ayah: number): boolean {
  const key = verseKey(surah, ayah);
  const has = libraryStore.get().memorised.includes(key);
  libraryStore.set((s) => {
    const reviews = { ...s.reviews };
    if (has) delete reviews[key];
    // First review tomorrow: the classic "sleep on it" step.
    else reviews[key] = { i: 1, due: addDays(today(), 1), n: 0, e: 2.5 };
    return { memorised: has ? s.memorised.filter((k) => k !== key) : [...s.memorised, key], reviews };
  });
  return !has;
}

/** Next schedule for a grade (pure, so buttons can preview it). */
export function schedule(r: Review | undefined, grade: Grade): Review {
  const cur = r ?? { i: 1, due: today(), n: 0, e: 2.5 };
  let { i, n, e } = cur;
  if (grade === "again") {
    n = 0;
    i = 1;
    e = Math.max(1.3, e - 0.2);
  } else if (grade === "hard") {
    i = Math.max(1, Math.round(i * 1.2));
    e = Math.max(1.3, e - 0.15);
    n += 1;
  } else if (grade === "good") {
    i = n === 0 ? 1 : n === 1 ? 3 : Math.round(i * e);
    n += 1;
  } else {
    i = n === 0 ? 3 : Math.round(Math.max(i, 1) * e * 1.3);
    e += 0.15;
    n += 1;
  }
  return { i, n, e, due: addDays(today(), i) };
}

export function gradeReview(key: string, grade: Grade) {
  libraryStore.set((s) => ({ reviews: { ...s.reviews, [key]: schedule(s.reviews[key], grade) } }));
}

/** Memorised ayat due today or earlier (missing schedules count as due), oldest first. */
export function dueReviews(state: Pick<LibraryState, "memorised" | "reviews">): string[] {
  const t = today();
  return state.memorised
    .filter((k) => (state.reviews[k]?.due ?? t) <= t)
    .sort((a, b) => (state.reviews[a]?.due ?? "").localeCompare(state.reviews[b]?.due ?? ""));
}

export function nextReviewDate(state: Pick<LibraryState, "memorised" | "reviews">): string | null {
  const dates = state.memorised.map((k) => state.reviews[k]?.due).filter(Boolean) as string[];
  return dates.length ? dates.sort()[0] : null;
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
