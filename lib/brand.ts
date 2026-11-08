/** Single source of truth for the product identity. */
export const BRAND = {
  name: "Mishkah",
  nameArabic: "مشكاة",
  tagline: "A lantern for the Qurʾān",
  description:
    "Mishkah is a calm, modern Qurʾān reader: Uthmani text, ten translations, word-by-word meanings, colour-coded tajweed and recitation that lights up every word.",
  /** The name comes from Āyat an-Nūr: "The example of His light is like a niche (mishkāh) within which is a lamp." */
  origin: { surah: 24, ayah: 35 },
  storagePrefix: "mishkah",
} as const;
