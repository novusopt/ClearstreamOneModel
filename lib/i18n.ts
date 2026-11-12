import { TRANSLATIONS } from "@/lib/constants";
import type { Chapter } from "@/lib/types";

/**
 * Localized surah and ayah pages (/fr/surah/18, /id/surah/36/1 …) for the translation languages.
 * English stays at the unprefixed URLs. Strings are deliberately few: page chrome around the
 * Qurʾān text, titles and descriptions for search.
 */
export const LOCALES = ["fr", "es", "id", "tr", "ur", "bn", "ru", "zh", "sv"] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (x: string): x is Locale => (LOCALES as readonly string[]).includes(x);
/** A page language: English (unprefixed URLs) or one of the locales. */
export type Lang = Locale | "en";

/** Languages with Al-Mukhtasar tafsir available (others show the English explanation). */
const TAFSIR_LOCALES: readonly string[] = ["fr", "es", "id", "tr", "bn", "ru", "zh"];
export const hasTafsir = (l: Lang) => l === "en" || TAFSIR_LOCALES.includes(l);

interface Strings {
  /** hreflang / html lang code. */
  code: string;
  native: string;
  dir: "ltr" | "rtl";
  surahTitle: (c: Chapter, meaning: string) => string;
  surahDescription: (c: Chapter, meaning: string) => string;
  ayahTitle: (c: Chapter, a: number) => string;
  ayahDescription: (c: Chapter, a: number, text: string) => string;
  surahHeading: (c: Chapter) => string;
  ayat: (n: number) => string;
  ayah: string;
  meccan: string;
  medinan: string;
  juz: string;
  page: string;
  /** "Pages 293–304", or the singular label for a single page. */
  pages: (from: number, to: number) => string;
  /** Word count badge ("1,579 words"). */
  words: (n: number) => string;
  /** Prostration badge: "Sajdah" for one, a count for more. */
  sajdah: (n: number) => string;
  translation: string;
  explanation: string;
  explanationEnglish: string;
  wordByWord: string;
  previousAyah: string;
  nextAyah: string;
  previousSurah: string;
  nextSurah: string;
  openReader: string;
  readAll: (c: Chapter) => string;
  listen: string;
  pause: string;
  share: string;
  linkCopied: string;
  surahs: string;
  otherLanguages: string;
}

const S: Record<Lang, Strings> = {
  en: {
    code: "en",
    native: "English",
    dir: "ltr",
    surahTitle: (c, m) => `Surah ${c.nameSimple} (${m}): Arabic, Translation & Audio`,
    surahDescription: (c, m) => `Read Surah ${c.nameSimple} (${c.nameArabic}, “${m}”): ${c.versesCount} ayat in Arabic with English translation, word-by-word meanings, colour-coded tajweed, tafsir and recitation.`,
    ayahTitle: (c, a) => `Surah ${c.nameSimple} ${c.id}:${a}: Arabic, Translation & Tafsir`,
    ayahDescription: (c, a, t) => `“${t}” Quran ${c.id}:${a} in Arabic with translation, word-by-word meaning and tafsir.`,
    surahHeading: (c) => `Surah ${c.nameSimple}`,
    ayat: (n) => `${n} ayat`,
    ayah: "Ayah",
    meccan: "Meccan",
    medinan: "Medinan",
    juz: "Juzʾ",
    page: "Page",
    pages: (a, b) => (a === b ? `Page ${a}` : `Pages ${a}–${b}`),
    words: (n) => `${n.toLocaleString("en")} words`,
    sajdah: (n) => (n === 1 ? "Sajdah" : `${n} sajdahs`),
    translation: "Translation",
    explanation: "Explanation (tafsir)",
    explanationEnglish: "Explanation (tafsir)",
    wordByWord: "Word by word",
    previousAyah: "Previous ayah",
    nextAyah: "Next ayah",
    previousSurah: "Previous surah",
    nextSurah: "Next surah",
    openReader: "Read in context",
    readAll: (c) => `Read all of Surah ${c.nameSimple}`,
    listen: "Listen",
    pause: "Pause",
    share: "Share",
    linkCopied: "Link copied",
    surahs: "Surahs",
    otherLanguages: "Other languages",
  },
  fr: {
    code: "fr",
    native: "Français",
    dir: "ltr",
    surahTitle: (c, m) => `Sourate ${c.nameSimple} (${m}) : arabe, traduction et audio`,
    surahDescription: (c, m) => `Lire la sourate ${c.nameSimple} (${c.nameArabic}, « ${m} ») : ${c.versesCount} versets en arabe avec la traduction française, l’explication (tafsir) et la récitation.`,
    ayahTitle: (c, a) => `Sourate ${c.nameSimple} ${c.id}:${a} : arabe, traduction et tafsir`,
    ayahDescription: (c, a, t) => `« ${t} » Coran ${c.id}:${a} en arabe avec traduction française et explication.`,
    surahHeading: (c) => `Sourate ${c.nameSimple}`,
    ayat: (n) => `${n} versets`,
    ayah: "Verset",
    meccan: "Mecquoise",
    medinan: "Médinoise",
    juz: "Juzʾ",
    page: "Page",
    pages: (a, b) => (a === b ? `Page ${a}` : `Pages ${a}–${b}`),
    words: (n) => `${n.toLocaleString("fr")} mots`,
    sajdah: (n) => (n === 1 ? "Prosternation" : `${n} prosternations`),
    translation: "Traduction",
    explanation: "Explication (tafsir)",
    explanationEnglish: "Explication (tafsir, en anglais)",
    wordByWord: "Mot à mot (en anglais)",
    previousAyah: "Verset précédent",
    nextAyah: "Verset suivant",
    previousSurah: "Sourate précédente",
    nextSurah: "Sourate suivante",
    openReader: "Ouvrir dans le lecteur",
    readAll: (c) => `Lire toute la sourate ${c.nameSimple}`,
    listen: "Écouter",
    pause: "Pause",
    share: "Partager",
    linkCopied: "Lien copié",
    surahs: "Sourates",
    otherLanguages: "Autres langues",
  },
  es: {
    code: "es",
    native: "Español",
    dir: "ltr",
    surahTitle: (c, m) => `Sura ${c.nameSimple} (${m}): árabe, traducción y audio`,
    surahDescription: (c, m) => `Lee la sura ${c.nameSimple} (${c.nameArabic}, «${m}»): ${c.versesCount} aleyas en árabe con traducción al español, explicación (tafsir) y recitación.`,
    ayahTitle: (c, a) => `Sura ${c.nameSimple} ${c.id}:${a}: árabe, traducción y tafsir`,
    ayahDescription: (c, a, t) => `«${t}» Corán ${c.id}:${a} en árabe con traducción al español y explicación.`,
    surahHeading: (c) => `Sura ${c.nameSimple}`,
    ayat: (n) => `${n} aleyas`,
    ayah: "Aleya",
    meccan: "Mequí",
    medinan: "Medinense",
    juz: "Yuz",
    page: "Página",
    pages: (a, b) => (a === b ? `Página ${a}` : `Páginas ${a}–${b}`),
    words: (n) => `${n.toLocaleString("es")} palabras`,
    sajdah: (n) => (n === 1 ? "Postración" : `${n} postraciones`),
    translation: "Traducción",
    explanation: "Explicación (tafsir)",
    explanationEnglish: "Explicación (tafsir, en inglés)",
    wordByWord: "Palabra por palabra (en inglés)",
    previousAyah: "Aleya anterior",
    nextAyah: "Aleya siguiente",
    previousSurah: "Sura anterior",
    nextSurah: "Sura siguiente",
    openReader: "Abrir en el lector",
    readAll: (c) => `Leer toda la sura ${c.nameSimple}`,
    listen: "Escuchar",
    pause: "Pausa",
    share: "Compartir",
    linkCopied: "Enlace copiado",
    surahs: "Suras",
    otherLanguages: "Otros idiomas",
  },
  id: {
    code: "id",
    native: "Bahasa Indonesia",
    dir: "ltr",
    surahTitle: (c, m) => `Surat ${c.nameSimple} (${m}): Arab, Latin, Terjemahan & Audio`,
    surahDescription: (c, m) => `Baca Surat ${c.nameSimple} (${c.nameArabic}, “${m}”): ${c.versesCount} ayat lengkap dalam bahasa Arab dengan terjemahan bahasa Indonesia, tafsir, dan murotal.`,
    ayahTitle: (c, a) => `Surat ${c.nameSimple} Ayat ${a} (${c.id}:${a}): Arab, Terjemahan & Tafsir`,
    ayahDescription: (c, a, t) => `“${t}” QS ${c.id}:${a} dalam bahasa Arab dengan terjemahan dan tafsir.`,
    surahHeading: (c) => `Surat ${c.nameSimple}`,
    ayat: (n) => `${n} ayat`,
    ayah: "Ayat",
    meccan: "Makkiyah",
    medinan: "Madaniyah",
    juz: "Juz",
    page: "Halaman",
    pages: (a, b) => (a === b ? `Halaman ${a}` : `Halaman ${a}–${b}`),
    words: (n) => `${n.toLocaleString("id")} kata`,
    sajdah: (n) => (n === 1 ? "Sajdah" : `${n} sajdah`),
    translation: "Terjemahan",
    explanation: "Tafsir",
    explanationEnglish: "Tafsir (bahasa Inggris)",
    wordByWord: "Per kata (bahasa Inggris)",
    previousAyah: "Ayat sebelumnya",
    nextAyah: "Ayat berikutnya",
    previousSurah: "Surat sebelumnya",
    nextSurah: "Surat berikutnya",
    openReader: "Buka di pembaca",
    readAll: (c) => `Baca seluruh Surat ${c.nameSimple}`,
    listen: "Dengarkan",
    pause: "Jeda",
    share: "Bagikan",
    linkCopied: "Tautan disalin",
    surahs: "Surat",
    otherLanguages: "Bahasa lain",
  },
  tr: {
    code: "tr",
    native: "Türkçe",
    dir: "ltr",
    surahTitle: (c, m) => `${c.nameSimple} Suresi (${m}): Arapça, Meal ve Dinle`,
    surahDescription: (c, m) => `${c.nameSimple} Suresi (${c.nameArabic}, “${m}”): ${c.versesCount} ayet Arapça metin, Türkçe meal, tefsir ve tilavet ile.`,
    ayahTitle: (c, a) => `${c.nameSimple} Suresi ${a}. Ayet (${c.id}:${a}): Arapça, Meal ve Tefsir`,
    ayahDescription: (c, a, t) => `“${t}” Kur’an ${c.id}:${a} Arapça metin, Türkçe meal ve tefsir ile.`,
    surahHeading: (c) => `${c.nameSimple} Suresi`,
    ayat: (n) => `${n} ayet`,
    ayah: "Ayet",
    meccan: "Mekki",
    medinan: "Medeni",
    juz: "Cüz",
    page: "Sayfa",
    pages: (a, b) => (a === b ? `Sayfa ${a}` : `Sayfalar ${a}–${b}`),
    words: (n) => `${n.toLocaleString("tr")} kelime`,
    sajdah: (n) => (n === 1 ? "Secde" : `${n} secde`),
    translation: "Meal",
    explanation: "Tefsir",
    explanationEnglish: "Tefsir (İngilizce)",
    wordByWord: "Kelime kelime (İngilizce)",
    previousAyah: "Önceki ayet",
    nextAyah: "Sonraki ayet",
    previousSurah: "Önceki sure",
    nextSurah: "Sonraki sure",
    openReader: "Okuyucuda aç",
    readAll: (c) => `${c.nameSimple} Suresi’nin tamamını oku`,
    listen: "Dinle",
    pause: "Duraklat",
    share: "Paylaş",
    linkCopied: "Bağlantı kopyalandı",
    surahs: "Sureler",
    otherLanguages: "Diğer diller",
  },
  ur: {
    code: "ur",
    native: "اردو",
    dir: "rtl",
    surahTitle: (c, m) => `سورۃ ${c.nameArabic} (${m}): عربی متن، اردو ترجمہ اور تلاوت`,
    surahDescription: (c, m) => `سورۃ ${c.nameArabic} (${c.nameSimple}، ”${m}“) کی ${c.versesCount} آیات عربی متن اور اردو ترجمہ کے ساتھ پڑھیں اور سنیں۔`,
    ayahTitle: (c, a) => `سورۃ ${c.nameArabic} آیت ${a} (${c.id}:${a}): عربی متن اور اردو ترجمہ`,
    ayahDescription: (c, a, t) => `”${t}“ قرآن ${c.id}:${a} عربی متن اور اردو ترجمہ کے ساتھ۔`,
    surahHeading: (c) => `سورۃ ${c.nameArabic}`,
    ayat: (n) => `${n} آیات`,
    ayah: "آیت",
    meccan: "مکی",
    medinan: "مدنی",
    juz: "پارہ",
    page: "صفحہ",
    pages: (a, b) => (a === b ? `صفحہ ${a}` : `صفحات ${a}–${b}`),
    words: (n) => `${n.toLocaleString("en")} الفاظ`,
    sajdah: (n) => (n === 1 ? "سجدہ" : `${n} سجدے`),
    translation: "ترجمہ",
    explanation: "تفسیر",
    explanationEnglish: "تفسیر (انگریزی)",
    wordByWord: "لفظ بہ لفظ (انگریزی)",
    previousAyah: "پچھلی آیت",
    nextAyah: "اگلی آیت",
    previousSurah: "پچھلی سورۃ",
    nextSurah: "اگلی سورۃ",
    openReader: "ریڈر میں کھولیں",
    readAll: (c) => `پوری سورۃ ${c.nameArabic} پڑھیں`,
    listen: "سنیں",
    pause: "روکیں",
    share: "شیئر کریں",
    linkCopied: "لنک کاپی ہو گیا",
    surahs: "سورتیں",
    otherLanguages: "دیگر زبانیں",
  },
  bn: {
    code: "bn",
    native: "বাংলা",
    dir: "ltr",
    surahTitle: (c, m) => `সূরা ${c.nameSimple} (${m}): আরবি, বাংলা অনুবাদ ও তিলাওয়াত`,
    surahDescription: (c, m) => `সূরা ${c.nameSimple} (${c.nameArabic}, “${m}”): ${c.versesCount}টি আয়াত আরবি, বাংলা অনুবাদ, তাফসীর ও তিলাওয়াতসহ পড়ুন।`,
    ayahTitle: (c, a) => `সূরা ${c.nameSimple} আয়াত ${a} (${c.id}:${a}): আরবি, অনুবাদ ও তাফসীর`,
    ayahDescription: (c, a, t) => `“${t}” কুরআন ${c.id}:${a} আরবি, বাংলা অনুবাদ ও তাফসীরসহ।`,
    surahHeading: (c) => `সূরা ${c.nameSimple}`,
    ayat: (n) => `${n}টি আয়াত`,
    ayah: "আয়াত",
    meccan: "মাক্কী",
    medinan: "মাদানী",
    juz: "পারা",
    page: "পৃষ্ঠা",
    pages: (a, b) => (a === b ? `পৃষ্ঠা ${a}` : `পৃষ্ঠা ${a}–${b}`),
    words: (n) => `${n.toLocaleString("en")}টি শব্দ`,
    sajdah: (n) => (n === 1 ? "সিজদা" : `${n}টি সিজদা`),
    translation: "অনুবাদ",
    explanation: "তাফসীর",
    explanationEnglish: "তাফসীর (ইংরেজি)",
    wordByWord: "শব্দে শব্দে (ইংরেজি)",
    previousAyah: "পূর্ববর্তী আয়াত",
    nextAyah: "পরবর্তী আয়াত",
    previousSurah: "পূর্ববর্তী সূরা",
    nextSurah: "পরবর্তী সূরা",
    openReader: "রিডারে খুলুন",
    readAll: (c) => `সম্পূর্ণ সূরা ${c.nameSimple} পড়ুন`,
    listen: "শুনুন",
    pause: "বিরতি",
    share: "শেয়ার করুন",
    linkCopied: "লিংক কপি হয়েছে",
    surahs: "সূরাসমূহ",
    otherLanguages: "অন্যান্য ভাষা",
  },
  ru: {
    code: "ru",
    native: "Русский",
    dir: "ltr",
    surahTitle: (c, m) => `Сура ${c.nameSimple} (${m}): арабский текст, перевод и аудио`,
    surahDescription: (c, m) => `Читать суру ${c.nameSimple} (${c.nameArabic}, «${m}»): ${c.versesCount} аятов на арабском с русским переводом, толкованием (тафсир) и чтением.`,
    ayahTitle: (c, a) => `Сура ${c.nameSimple}, аят ${a} (${c.id}:${a}): текст, перевод и тафсир`,
    ayahDescription: (c, a, t) => `«${t}» Коран ${c.id}:${a} на арабском с русским переводом и толкованием.`,
    surahHeading: (c) => `Сура ${c.nameSimple}`,
    ayat: (n) => `Аятов: ${n}`,
    ayah: "Аят",
    meccan: "Мекканская",
    medinan: "Мединская",
    juz: "Джуз",
    page: "Страница",
    pages: (a, b) => (a === b ? `Страница ${a}` : `Страницы ${a}–${b}`),
    words: (n) => `Слов: ${n.toLocaleString("ru")}`,
    sajdah: (n) => (n === 1 ? "Саджда" : `Саджды: ${n}`),
    translation: "Перевод",
    explanation: "Толкование (тафсир)",
    explanationEnglish: "Толкование (тафсир, на английском)",
    wordByWord: "Пословный перевод (на английском)",
    previousAyah: "Предыдущий аят",
    nextAyah: "Следующий аят",
    previousSurah: "Предыдущая сура",
    nextSurah: "Следующая сура",
    openReader: "Открыть в читалке",
    readAll: (c) => `Читать всю суру ${c.nameSimple}`,
    listen: "Слушать",
    pause: "Пауза",
    share: "Поделиться",
    linkCopied: "Ссылка скопирована",
    surahs: "Суры",
    otherLanguages: "Другие языки",
  },
  zh: {
    code: "zh-Hans",
    native: "中文",
    dir: "ltr",
    surahTitle: (c, m) => `第${c.id}章 ${m}（${c.nameSimple}）：阿拉伯原文、中文译文与诵读`,
    surahDescription: (c, m) => `阅读《古兰经》第${c.id}章“${m}”（${c.nameSimple}，${c.nameArabic}）：共${c.versesCount}节，附阿拉伯原文、中文译文、经注与诵读。`,
    ayahTitle: (c, a) => `《古兰经》${c.id}:${a}（${c.nameSimple}第${a}节）：原文、译文与经注`,
    ayahDescription: (c, a, t) => `“${t}”《古兰经》${c.id}:${a}，附阿拉伯原文、中文译文与经注。`,
    surahHeading: (c) => `第${c.id}章 ${c.names?.zh ?? c.nameSimple}`,
    ayat: (n) => `共${n}节`,
    ayah: "节",
    meccan: "麦加章",
    medinan: "麦地那章",
    juz: "卷",
    page: "页",
    pages: (a, b) => (a === b ? `第${a}页` : `第${a}–${b}页`),
    words: (n) => `共${n.toLocaleString("en")}词`,
    sajdah: (n) => (n === 1 ? "叩头处" : `${n}处叩头`),
    translation: "译文",
    explanation: "经注",
    explanationEnglish: "经注（英文）",
    wordByWord: "逐词释义（英文）",
    previousAyah: "上一节",
    nextAyah: "下一节",
    previousSurah: "上一章",
    nextSurah: "下一章",
    openReader: "在阅读器中打开",
    readAll: (c) => `阅读第${c.id}章全文`,
    listen: "收听",
    pause: "暂停",
    share: "分享",
    linkCopied: "链接已复制",
    surahs: "章目",
    otherLanguages: "其他语言",
  },
  sv: {
    code: "sv",
    native: "Svenska",
    dir: "ltr",
    surahTitle: (c, m) => `Sura ${c.nameSimple} (${m}): arabiska, översättning och ljud`,
    surahDescription: (c, m) => `Läs sura ${c.nameSimple} (${c.nameArabic}, ”${m}”): ${c.versesCount} verser på arabiska med svensk översättning och recitation.`,
    ayahTitle: (c, a) => `Sura ${c.nameSimple} ${c.id}:${a}: arabiska och svensk översättning`,
    ayahDescription: (c, a, t) => `”${t}” Koranen ${c.id}:${a} på arabiska med svensk översättning.`,
    surahHeading: (c) => `Sura ${c.nameSimple}`,
    ayat: (n) => `${n} verser`,
    ayah: "Vers",
    meccan: "Mekkansk",
    medinan: "Medinensisk",
    juz: "Juz",
    page: "Sida",
    pages: (a, b) => (a === b ? `Sida ${a}` : `Sidor ${a}–${b}`),
    words: (n) => `${n.toLocaleString("sv")} ord`,
    sajdah: (n) => (n === 1 ? "Sajda" : `${n} sajdor`),
    translation: "Översättning",
    explanation: "Förklaring (tafsir)",
    explanationEnglish: "Förklaring (tafsir, på engelska)",
    wordByWord: "Ord för ord (på engelska)",
    previousAyah: "Föregående vers",
    nextAyah: "Nästa vers",
    previousSurah: "Föregående sura",
    nextSurah: "Nästa sura",
    openReader: "Öppna i läsaren",
    readAll: (c) => `Läs hela sura ${c.nameSimple}`,
    listen: "Lyssna",
    pause: "Paus",
    share: "Dela",
    linkCopied: "Länken kopierad",
    surahs: "Suror",
    otherLanguages: "Andra språk",
  },
};

export const t = (l: Lang) => S[l];
export const translator = (l: Lang) => TRANSLATIONS.find((x) => x.id === l)?.author ?? "";
/** Surah name meaning in a language (falls back to English). */
export const meaningIn = (c: Chapter, l: Lang) => (l === "en" ? c.nameTranslation : (c.names?.[l] ?? c.nameTranslation));

/** Localized path for an English path ("/surah/18/10" → "/fr/surah/18/10"). */
export const localePath = (l: Lang, path: string) => (l === "en" ? path : path === "/" ? `/${l}` : `/${l}${path}`);

/** hreflang alternates for a page that exists in English and every locale. */
export function languageAlternates(path: string): Record<string, string> {
  return {
    en: path,
    ...Object.fromEntries(LOCALES.map((l) => [S[l].code, localePath(l, path)])),
    "x-default": path,
  };
}

/** Open Graph locale (language_TERRITORY). */
const OG_LOCALES: Record<Lang, string> = { en: "en_GB", fr: "fr_FR", es: "es_ES", id: "id_ID", tr: "tr_TR", ur: "ur_PK", bn: "bn_BD", ru: "ru_RU", zh: "zh_CN", sv: "sv_SE" };
export const ogLocale = (l: Lang) => OG_LOCALES[l];

/** All languages for switchers: English first. */
export const ALL_LANGUAGES: Array<{ id: Lang; native: string; code: string }> = (["en", ...LOCALES] as Lang[]).map((l) => ({ id: l, native: S[l].native, code: S[l].code }));
