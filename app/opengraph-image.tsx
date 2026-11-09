import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/og-card";

export const alt = "Mishkah: read the Qurʾān with translation, word-by-word meanings, tajweed, tafsir and audio";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "114 surahs · 6,236 ayat",
    title: "Read the Qurʾān, word by word",
    subtitle: "Translation in 10 languages, tajweed in colour, tafsir and recitation that follows every word.",
  });
}
