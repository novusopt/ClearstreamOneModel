/** A tajweed segment: [text] or [text, ruleClass]. */
export type TajweedSegment = [string] | [string, string];

export interface Word {
  /** Uthmani Arabic text. */
  a: string;
  /** Transliteration. */
  t: string;
  /** English word-by-word gloss. */
  e: string;
  /** Tajweed-annotated Uthmani text: a plain string when no rule applies. */
  j: string | TajweedSegment[];
  /** Recitation timing (ms from start of the ayah audio) for the word-synced reciter. */
  s?: number;
  f?: number;
}

export interface Verse {
  /** Ayah number within the surah. */
  n: number;
  /** Global ayah number (1–6236). */
  g: number;
  /** Full-verse transliteration. */
  tr: string;
  /** English translation (Saheeh International). */
  en: string;
  w: Word[];
}

export interface Chapter {
  id: number;
  nameArabic: string;
  nameSimple: string;
  nameTranslation: string;
  revelation: "meccan" | "medinan";
  versesCount: number;
}

export interface SurahData {
  id: number;
  verses: Verse[];
}

/** Minimal verse info the audio engine needs (keeps the player payload small). */
export interface AudioVerse {
  n: number;
  g: number;
  /** [start, end] ms per word, when the reciter has word timings. */
  t: Array<[number, number] | null>;
}
