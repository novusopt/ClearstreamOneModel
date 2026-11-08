"use client";

import { toast } from "sonner";
import { ayahAudioUrls, getReciter, wordAudioUrl } from "@/lib/audio";
import { createStore, useStore } from "@/lib/create-store";
import { IS_ARTIFACT } from "@/lib/runtime";
import { settingsStore } from "@/lib/settings";
import type { AudioVerse } from "@/lib/types";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused";

interface PlayerState {
  surah: number | null;
  surahName: string;
  verses: AudioVerse[];
  index: number;
  status: PlayerStatus;
}

interface TickState {
  /** Active word index within the current ayah, or -1. */
  word: number;
  time: number;
  duration: number;
}

const PLAYER_INITIAL: PlayerState = { surah: null, surahName: "", verses: [], index: 0, status: "idle" };
const TICK_INITIAL: TickState = { word: -1, time: 0, duration: 0 };

export const playerStore = createStore<PlayerState>(PLAYER_INITIAL);
export const tickStore = createStore<TickState>(TICK_INITIAL);

export const usePlayer = <S,>(sel: (s: PlayerState) => S) => useStore(playerStore, sel, PLAYER_INITIAL);
export const useTick = <S,>(sel: (s: TickState) => S) => useStore(tickStore, sel, TICK_INITIAL);

let audio: HTMLAudioElement | null = null;
let wordAudio: HTMLAudioElement | null = null;
let preloader: HTMLAudioElement | null = null;
let urls: string[] = [];
let urlIdx = 0;
let raf = 0;
let pendingSeekMs: number | null = null;

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.addEventListener("playing", () => {
    playerStore.set({ status: "playing" });
    startLoop();
  });
  audio.addEventListener("pause", () => {
    if (playerStore.get().status === "playing") playerStore.set({ status: "paused" });
    stopLoop();
  });
  audio.addEventListener("waiting", () => playerStore.set({ status: "loading" }));
  audio.addEventListener("loadedmetadata", () => {
    tickStore.set({ duration: audio!.duration });
    if (pendingSeekMs != null) {
      audio!.currentTime = pendingSeekMs / 1000;
      pendingSeekMs = null;
    }
  });
  audio.addEventListener("ended", onEnded);
  audio.addEventListener("error", () => {
    // Try the next mirror before giving up.
    if (urlIdx < urls.length - 1) {
      urlIdx += 1;
      audio!.src = urls[urlIdx];
      void audio!.play().catch(() => playerStore.set({ status: "paused" }));
    } else {
      playerStore.set({ status: "paused" });
    }
  });
  return audio;
}

function currentReciter() {
  return getReciter(settingsStore.get().reciter);
}

function computeWord(ms: number): number {
  const { verses, index } = playerStore.get();
  const v = verses[index];
  if (!v || !currentReciter().wordSync) return -1;
  for (let i = 0; i < v.t.length; i++) {
    const t = v.t[i];
    if (t && ms >= t[0] && ms < t[1] + 10) return i;
  }
  return -1;
}

function loop() {
  if (!audio) return;
  const time = audio.currentTime;
  const word = computeWord(time * 1000);
  const prev = tickStore.get();
  if (word !== prev.word || Math.abs(time - prev.time) > 0.2) tickStore.set({ word, time });
  raf = requestAnimationFrame(loop);
}

function startLoop() {
  stopLoop();
  raf = requestAnimationFrame(loop);
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

function loadIndex(index: number, autoplay: boolean, seekMs?: number) {
  const el = ensureAudio();
  const { verses, surah } = playerStore.get();
  const v = verses[index];
  if (!v || surah == null) return;
  const reciter = currentReciter();
  urls = ayahAudioUrls(reciter, surah, v.n, v.g);
  urlIdx = 0;
  pendingSeekMs = seekMs ?? null;
  playerStore.set({ index, status: autoplay ? "loading" : "paused" });
  tickStore.set({ word: -1, time: 0, duration: 0 });
  el.src = urls[0];
  el.playbackRate = settingsStore.get().playbackRate;
  if (autoplay) void el.play().catch(() => playerStore.set({ status: "paused" }));
  preloadNext(index + 1);
}

function preloadNext(index: number) {
  const { verses, surah } = playerStore.get();
  const v = verses[index];
  if (!v || surah == null) return;
  preloader ??= new Audio();
  preloader.preload = "auto";
  preloader.src = ayahAudioUrls(currentReciter(), surah, v.n, v.g)[0];
}

function onEnded() {
  const { index, verses } = playerStore.get();
  const { repeat } = settingsStore.get();
  if (repeat === "ayah") return loadIndex(index, true);
  if (index < verses.length - 1) return loadIndex(index + 1, true);
  if (repeat === "surah") return loadIndex(0, true);
  playerStore.set({ status: "paused" });
  tickStore.set({ word: -1 });
}

function audioBlocked(): boolean {
  if (!IS_ARTIFACT) return false;
  toast.info("Recitation isn't available on this preview page", {
    id: "audio-blocked",
    description: "Audio streams from external recitation servers, which this hosted page can't reach. It plays in the full app.",
  });
  return true;
}

export const player = {
  /** Start (or restart) playback of a surah at a given ayah index. */
  play(surah: number, surahName: string, verses: AudioVerse[], index = 0, seekMs?: number) {
    if (audioBlocked()) return;
    wordAudio?.pause();
    playerStore.set({ surah, surahName, verses });
    loadIndex(index, true, seekMs);
  },
  toggle() {
    const el = ensureAudio();
    const { status, surah } = playerStore.get();
    if (surah == null) return;
    if (status === "playing" || status === "loading") el.pause();
    else {
      wordAudio?.pause();
      if (!el.src) loadIndex(playerStore.get().index, true);
      else void el.play().catch(() => playerStore.set({ status: "paused" }));
    }
  },
  next() {
    const { index, verses } = playerStore.get();
    if (index < verses.length - 1) loadIndex(index + 1, true);
  },
  prev() {
    const { index } = playerStore.get();
    if (audio && audio.currentTime > 3) audio.currentTime = 0;
    else loadIndex(Math.max(0, index - 1), true);
  },
  seek(seconds: number) {
    if (audio) audio.currentTime = seconds;
  },
  setRate(rate: number) {
    settingsStore.set({ playbackRate: rate });
    if (audio) audio.playbackRate = rate;
  },
  /** Reload the current ayah, e.g. after the reciter changes. */
  reload() {
    const { surah, index, status } = playerStore.get();
    if (surah != null) loadIndex(index, status === "playing" || status === "loading");
  },
  stop() {
    audio?.pause();
    if (audio) audio.removeAttribute("src");
    stopLoop();
    playerStore.set(PLAYER_INITIAL);
    tickStore.set(TICK_INITIAL);
  },
  /** Plays a single word's pronunciation (pauses the recitation). */
  playWord(surah: number, ayah: number, word: number) {
    if (audioBlocked()) return;
    audio?.pause();
    wordAudio ??= new Audio();
    wordAudio.src = wordAudioUrl(surah, ayah, word);
    void wordAudio.play().catch(() => undefined);
  },
};
