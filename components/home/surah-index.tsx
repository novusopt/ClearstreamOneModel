"use client";

import { SearchLg } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Tabs } from "@/components/application/tabs/tabs";
import { Input } from "@/components/base/input/input";
import { JUZ_STARTS } from "@/lib/constants";
import type { Chapter } from "@/lib/types";
import { normalizeArabic, normalizeLatin, toArabicNumber } from "@/lib/utils";
import { cx } from "@/utils/cx";

type Filter = "all" | "meccan" | "medinan";

function SurahCard({ chapter, i }: { chapter: Chapter; i: number }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.45, delay: (i % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/surah/${chapter.id}`}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-secondary bg-primary p-4 outline-focus-ring transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="relative flex size-12 shrink-0 items-center justify-center">
          <span className="absolute inset-0 rotate-45 rounded-xl bg-secondary ring-1 ring-secondary transition duration-500 group-hover:rotate-[135deg] group-hover:bg-brand-solid" />
          <span className="relative text-sm font-semibold text-secondary tabular-nums transition group-hover:text-white">{chapter.id}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-primary">{chapter.nameSimple}</span>
          <span className="block truncate text-sm text-tertiary">{chapter.nameTranslation}</span>
        </span>
        <span className="text-right">
          <span lang="ar" dir="rtl" className="block font-quran text-2xl leading-tight text-primary">
            {chapter.nameArabic}
          </span>
          <span className="block text-xs text-quaternary">
            {chapter.versesCount} ayat · {chapter.revelation === "meccan" ? "Meccan" : "Medinan"}
          </span>
        </span>
      </Link>
    </motion.li>
  );
}

export function SurahIndex({ chapters }: { chapters: Chapter[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const deferred = useDeferredValue(query);

  const results = useMemo(() => {
    const q = deferred.trim();
    const qLatin = normalizeLatin(q);
    const qArabic = normalizeArabic(q);
    return chapters.filter((c) => {
      if (filter !== "all" && c.revelation !== filter) return false;
      if (!q) return true;
      if (/^\d+$/.test(q)) return String(c.id).startsWith(q);
      return (
        normalizeLatin(c.nameSimple).includes(qLatin) ||
        normalizeLatin(c.nameTranslation).includes(qLatin) ||
        (qArabic.length > 0 && normalizeArabic(c.nameArabic).includes(qArabic))
      );
    });
  }, [chapters, deferred, filter]);

  return (
    <section id="surahs" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="text-sm font-semibold text-brand-secondary">The Noble Qurʾān</p>
            <h2 className="mt-2 text-display-sm font-display font-medium tracking-tight text-primary">All 114 surahs</h2>
          </motion.div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            <Tabs selectedKey={filter} onSelectionChange={(k) => setFilter(k as Filter)} className="w-auto">
              <Tabs.List
                type="button-gray"
                size="sm"
                aria-label="Filter by revelation"
                items={[
                  { id: "all", label: "All" },
                  { id: "meccan", label: "Meccan" },
                  { id: "medinan", label: "Medinan" },
                ]}
              />
            </Tabs>
            <Input
              aria-label="Search surahs"
              placeholder="Search by name, meaning or number"
              icon={SearchLg}
              value={query}
              onChange={setQuery}
              className="sm:w-80"
              type="search"
            />
          </div>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {results.map((c, i) => (
              <SurahCard key={c.id} chapter={c} i={i} />
            ))}
          </AnimatePresence>
        </ul>
        {results.length === 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center text-tertiary">
            No surah matches “{query}”.
          </motion.p>
        )}
      </div>
    </section>
  );
}

export function JuzIndex({ chapters }: { chapters: Chapter[] }) {
  return (
    <section id="juz" className="scroll-mt-24 pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-semibold text-brand-secondary">Thirty parts</p>
          <h2 className="mt-2 text-display-sm font-display font-medium tracking-tight text-primary">Browse by juzʾ</h2>
        </motion.div>
        <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {JUZ_STARTS.map(([s, a], i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.04 }}
            >
              <Link
                href={`/surah/${s}#v-${a}`}
                className={cx(
                  "group flex h-full flex-col rounded-2xl border border-secondary bg-primary p-4 outline-focus-ring transition hover:-translate-y-0.5 hover:border-brand hover:bg-brand-primary/40 focus-visible:outline-2",
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-tertiary">Juzʾ {i + 1}</span>
                  <span lang="ar" className="font-quran text-lg text-gold-600 dark:text-gold-400">
                    {toArabicNumber(i + 1)}
                  </span>
                </span>
                <span className="mt-2 truncate font-semibold text-primary">{chapters[s - 1].nameSimple}</span>
                <span className="text-xs text-quaternary tabular-nums">
                  from {s}:{a}
                </span>
              </Link>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
