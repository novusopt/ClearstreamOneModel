/**
 * Well-known names of individual ayat, as people search for them ("ayatul kursi", "ayat an nur").
 * Shown on ayah pages and used in their titles. Keep this list to names in common, established use.
 */
export const AYAH_NAMES: Record<string, { name: string; also?: string[] }> = {
  "2:255": { name: "Āyat al-Kursī", also: ["Ayatul Kursi", "The Throne Verse"] },
  "2:285": { name: "Āmana r-Rasūl", also: ["Last two ayat of Al-Baqarah"] },
  "2:286": { name: "Closing ayah of Al-Baqarah", also: ["Last two ayat of Al-Baqarah", "Lā yukallifu llāhu nafsan illā wusʿahā"] },
  "24:35": { name: "Āyat an-Nūr", also: ["The Light Verse"] },
  "94:5": { name: "With hardship comes ease", also: ["Inna maʿa l-ʿusri yusrā"] },
  "94:6": { name: "With hardship comes ease", also: ["Inna maʿa l-ʿusri yusrā"] },
};

export const ayahName = (surah: number, ayah: number) => AYAH_NAMES[`${surah}:${ayah}`];
