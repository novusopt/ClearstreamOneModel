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
  /**
   * Position of the word's pronunciation in the word audio, when it isn't index + 1 (pause marks,
   * ۞ and ۩ take positions of their own); 0 when there is no recording.
   */
  k?: number;
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
  /** Madani mushaf page (1–604). */
  p?: number;
  /** Hizb quarter (1–240) that starts at this ayah. */
  q?: number;
}

export interface Chapter {
  id: number;
  nameArabic: string;
  nameSimple: string;
  nameTranslation: string;
  /** Surah name meaning per translation language (fr, es, id, tr, ur, bn, ru, zh, sv). */
  names?: Record<string, string>;
  revelation: "meccan" | "medinan";
  versesCount: number;
  /** First and last Madani mushaf page. */
  pages?: [number, number];
  words?: number;
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

/** An ayah with near-identical wording (mutashabih). */
export interface SimilarRef {
  s: number;
  a: number;
  /** Surah name. */
  n: string;
  /** Arabic text. */
  t: string;
}
