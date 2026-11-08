export const TOTAL_SURAHS = 114;
export const TOTAL_AYAT = 6236;
export const TOTAL_WORDS = 77429;

export interface Reciter {
  id: string;
  name: string;
  style: string;
  /** True when per-word timings exist, enabling word-by-word highlighting. */
  wordSync: boolean;
  /** Primary source: cdn.islamic.network, keyed by global ayah number. */
  edition: string;
  bitrate: number;
  /** Fallback source: everyayah.com folder, keyed by SSSAAA. */
  everyayah: string;
}

export const RECITERS: Reciter[] = [
  { id: "husary", name: "Mahmoud Khalil Al-Husary", style: "Murattal · word sync", wordSync: true, edition: "ar.husary", bitrate: 128, everyayah: "Husary_64kbps" },
  { id: "alafasy", name: "Mishary Rashid Alafasy", style: "Murattal", wordSync: false, edition: "ar.alafasy", bitrate: 128, everyayah: "Alafasy_128kbps" },
  { id: "abdulbasit", name: "Abdul Basit Abdus Samad", style: "Murattal", wordSync: false, edition: "ar.abdulbasitmurattal", bitrate: 192, everyayah: "Abdul_Basit_Murattal_192kbps" },
  { id: "minshawi", name: "Mohamed Siddiq Al-Minshawi", style: "Murattal", wordSync: false, edition: "ar.minshawi", bitrate: 128, everyayah: "Minshawy_Murattal_128kbps" },
  { id: "sudais", name: "Abdur-Rahman As-Sudais", style: "Murattal", wordSync: false, edition: "ar.abdurrahmaansudais", bitrate: 192, everyayah: "Abdurrahmaan_As-Sudais_192kbps" },
];

export const DEFAULT_RECITER = "husary";

export interface TranslationOption {
  id: string;
  language: string;
  author: string;
  rtl?: boolean;
}

export const TRANSLATIONS: TranslationOption[] = [
  { id: "en", language: "English", author: "Saheeh International" },
  { id: "fr", language: "Français", author: "Muhammad Hamidullah" },
  { id: "es", language: "Español", author: "Muhammad Isa García" },
  { id: "id", language: "Bahasa Indonesia", author: "Indonesian Ministry of Religious Affairs" },
  { id: "tr", language: "Türkçe", author: "Diyanet İşleri Başkanlığı" },
  { id: "ur", language: "اردو", author: "Abul Aʿla Maududi", rtl: true },
  { id: "bn", language: "বাংলা", author: "Muhiuddin Khan" },
  { id: "ru", language: "Русский", author: "Elmir Kuliev" },
  { id: "zh", language: "中文", author: "Muhammad Makin" },
  { id: "sv", language: "Svenska", author: "Knut Bernström" },
];

export interface TajweedRule {
  id: string;
  /** CSS classes (in app/globals.css) that this legend entry covers. */
  classes: string[];
  name: string;
  arabic: string;
  description: string;
}

export const TAJWEED_RULES: TajweedRule[] = [
  { id: "ghunnah", classes: ["ghunnah"], name: "Ghunnah", arabic: "غُنَّة", description: "Nasalisation held for two counts on a doubled nūn or mīm." },
  { id: "ikhfa", classes: ["ikhafa"], name: "Ikhfāʾ", arabic: "إخفاء", description: "A nūn sākinah or tanwīn is concealed with a light nasal sound." },
  { id: "ikhfa_shafawi", classes: ["ikhafa_shafawi"], name: "Ikhfāʾ Shafawī", arabic: "إخفاء شفوي", description: "A mīm sākinah before bāʾ is concealed with the lips." },
  { id: "idgham_ghunnah", classes: ["idgham_ghunnah"], name: "Idghām with Ghunnah", arabic: "إدغام بغنة", description: "Merging nūn sākinah/tanwīn into ي ن م و with nasalisation." },
  { id: "idgham_wo_ghunnah", classes: ["idgham_wo_ghunnah"], name: "Idghām without Ghunnah", arabic: "إدغام بلا غنة", description: "Merging into ل or ر without nasalisation." },
  { id: "idgham_shafawi", classes: ["idgham_shafawi"], name: "Idghām Shafawī", arabic: "إدغام شفوي", description: "A mīm sākinah merges into a following mīm." },
  { id: "idgham_misc", classes: ["idgham_mutajanisayn", "idgham_mutaqaribayn"], name: "Idghām Mutajānisayn / Mutaqāribayn", arabic: "إدغام متجانسين", description: "Merging of letters that share or neighbour an articulation point." },
  { id: "iqlab", classes: ["iqlab"], name: "Iqlāb", arabic: "إقلاب", description: "A nūn sākinah or tanwīn before bāʾ turns into a mīm sound." },
  { id: "qalqalah", classes: ["qalaqah"], name: "Qalqalah", arabic: "قلقلة", description: "An echoing bounce on ق ط ب ج د when they carry sukūn." },
  { id: "madd_normal", classes: ["madda_normal"], name: "Madd Ṭabīʿī", arabic: "مد طبيعي", description: "Natural prolongation of two counts." },
  { id: "madd_permissible", classes: ["madda_permissible"], name: "Madd Jāʾiz", arabic: "مد جائز", description: "Permissible prolongation of 2, 4 or 6 counts." },
  { id: "madd_obligatory", classes: ["madda_obligatory_mottasel", "madda_obligatory_monfasel"], name: "Madd Wājib / Munfaṣil", arabic: "مد واجب", description: "Obligatory prolongation of 4–5 counts before a hamzah." },
  { id: "madd_necessary", classes: ["madda_necessary"], name: "Madd Lāzim", arabic: "مد لازم", description: "Necessary prolongation of six counts." },
  { id: "silent", classes: ["ham_wasl", "slnt", "laam_shamsiyah"], name: "Silent letters", arabic: "حروف لا تنطق", description: "Hamzat al-waṣl, lām shamsiyyah and other unpronounced letters." },
];

/** First ayah of each juzʾ: [surah, ayah]. */
export const JUZ_STARTS: Array<[number, number]> = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

export const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";
