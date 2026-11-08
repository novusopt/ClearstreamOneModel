import { RECITERS, type Reciter } from "@/lib/constants";
import { pad3 } from "@/lib/utils";

export function getReciter(id: string): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}

/** Candidate URLs for an ayah recitation, in fallback order. */
export function ayahAudioUrls(reciter: Reciter, surah: number, ayah: number, globalAyah: number): string[] {
  return [
    `https://cdn.islamic.network/quran/audio/${reciter.bitrate}/${reciter.edition}/${globalAyah}.mp3`,
    `https://everyayah.com/data/${reciter.everyayah}/${pad3(surah)}${pad3(ayah)}.mp3`,
    `https://mirrors.quranicaudio.com/everyayah/${reciter.everyayah}/${pad3(surah)}${pad3(ayah)}.mp3`,
  ];
}

/** Single-word pronunciation clip (public word-by-word audio CDN). */
export function wordAudioUrl(surah: number, ayah: number, word: number): string {
  return `https://audio.qurancdn.com/wbw/${pad3(surah)}_${pad3(ayah)}_${pad3(word)}.mp3`;
}
