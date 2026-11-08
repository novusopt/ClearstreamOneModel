import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import chaptersJson from "@/data/quran/chapters.json";
import type { Chapter, SurahData } from "@/lib/types";

const chapters = chaptersJson as Chapter[];

export function getChapters(): Chapter[] {
  return chapters;
}

export function getChapter(id: number): Chapter | undefined {
  return chapters[id - 1];
}

export function isValidSurahId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= 114;
}

/** Reads a surah from the bundled dataset (see scripts/build-quran-data.mjs). */
export async function getSurah(id: number): Promise<SurahData> {
  const file = join(process.cwd(), "data", "quran", "surah", `${id}.json`);
  return JSON.parse(await readFile(file, "utf8")) as SurahData;
}
