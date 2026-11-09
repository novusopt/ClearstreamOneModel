"use client";

import { BookOpen02, ChevronDown } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { tafsirLangFor, TAFSIR_SOURCE } from "@/lib/constants";
import { dataUrl, pickSurah } from "@/lib/data-urls";
import { useSettings } from "@/lib/settings";
import { useRemote } from "@/lib/use-remote";
import { cx } from "@/utils/cx";

/** Resolved tafsir language: explicit choice, or the translation language (English fallback). */
export function useTafsirLang() {
  return useSettings((s) => (s.tafsirLang === "auto" ? tafsirLangFor(s.translation) : s.tafsirLang));
}

/** Load the Al-Mukhtasar explanation for one ayah (only while `enabled`). */
export function useTafsirText(surah: number, ayah: number, enabled: boolean): { text: string | null; lang: string } {
  const lang = useTafsirLang();
  const raw = useRemote<unknown>(enabled ? dataUrl.tafsir(lang, surah) : null);
  const list = raw ? pickSurah<string[]>("tafsir", raw, surah) : null;
  return { text: list?.[ayah - 1] ?? null, lang };
}

export function TafsirBody({ text, lang, className }: { text: string | null; lang: string; className?: string }) {
  const rtl = lang === "ar";
  return (
    <div className={cx("rounded-2xl border border-secondary bg-secondary/60 p-4 sm:p-5", className)}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-gold-700 dark:text-gold-300">
        <BookOpen02 aria-hidden="true" className="size-3.5" />
        Explanation
        <span className="font-normal text-quaternary">
          {TAFSIR_SOURCE.name} · {TAFSIR_SOURCE.author}
        </span>
      </p>
      {text ? (
        <p
          dir={rtl ? "rtl" : "ltr"}
          lang={lang}
          className={cx("mt-2 text-secondary", rtl ? "font-quran text-xl leading-loose" : "text-md leading-relaxed")}
        >
          {text}
        </p>
      ) : (
        <div className="mt-3 space-y-2" aria-label="Loading explanation">
          <span className="block h-3 w-11/12 animate-pulse rounded bg-quaternary" />
          <span className="block h-3 w-9/12 animate-pulse rounded bg-quaternary" />
        </div>
      )}
    </div>
  );
}

/** "Explanation" toggle + collapsible tafsir under an ayah. */
export function TafsirSection({ surah, ayah }: { surah: number; ayah: number }) {
  const openByDefault = useSettings((s) => s.tafsirOpen);
  const [override, setOverride] = useState<boolean | null>(null);
  const open = override ?? openByDefault;
  const { text, lang } = useTafsirText(surah, ayah, open);

  return (
    <div>
      <Button
        size="sm"
        color="link-gray"
        iconLeading={BookOpen02}
        iconTrailing={<ChevronDown data-icon aria-hidden="true" className={cx("size-4 transition-transform duration-300", open && "rotate-180")} />}
        aria-expanded={open}
        onPress={() => setOverride(!open)}
      >
        {open ? "Hide explanation" : "Explanation"}
      </Button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <TafsirBody text={text} lang={lang} className="mt-3" />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
