"use client";

import { SearchLg } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { JUZ_STARTS } from "@/lib/constants";
import { useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";
import { normalizeArabic, normalizeLatin, toArabicNumber } from "@/lib/utils";
import { cx } from "@/utils/cx";

type Filter = "all" | "meccan" | "medinan";

function SurahCard({ chapter, i }: { chapter: Chapter; i: number }) {
  const readCount = useLibrary((st) => st.read[chapter.id]?.length ?? 0);
  const pct = Math.round((readCount / chapter.versesCount) * 100);
  return (
    <motion.li
      layout
      initial={{ y: 24 }}
      whileInView={{ y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.45, delay: (i % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/surah/${chapter.id}`}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-secondary bg-primary p-4 outline-focus-ring transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="relative flex size-12 shrink-0 items-center justify-center">
          <span className="absolute inset-[7px] rotate-45 rounded-lg bg-secondary ring-1 ring-secondary transition duration-500 group-hover:rotate-[135deg] group-hover:bg-brand-solid" />
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
          <span className="mt-1 flex justify-end gap-1">
            <Badge type="modern" size="sm" color="gray">
              {chapter.versesCount} ayat
            </Badge>
            <Badge type="pill-color" size="sm" color={chapter.revelation === "meccan" ? "warning" : "brand"}>
              {chapter.revelation === "meccan" ? "Meccan" : "Medinan"}
            </Badge>
          </span>
        </span>
        {readCount > 0 && (
          <span className="absolute inset-x-4 bottom-0" title={`${pct}% read`}>
            <ProgressBarBase value={pct} className="h-0.5 rounded-none bg-transparent" progressClassName="rounded-none bg-gold-500" />
            <span className="sr-only">{pct}% read</span>
          </span>
        )}
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
          <motion.div initial={{ x: -24 }} whileInView={{ x: 0 }} viewport={{ once: true }}>
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
          <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-12">
            <EmptyState size="sm">
              <EmptyState.Header pattern="circle">
                <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
              </EmptyState.Header>
              <EmptyState.Content>
                <EmptyState.Title>No surah found</EmptyState.Title>
                <EmptyState.Description>
                  Nothing matches “{query}”. Try a name like Kahf, a meaning like “The Cave”, or a number from 1 to 114.
                </EmptyState.Description>
              </EmptyState.Content>
              <EmptyState.Footer>
                <Button
                  color="secondary"
                  onPress={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Clear search
                </Button>
              </EmptyState.Footer>
            </EmptyState>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export function JuzIndex({ chapters }: { chapters: Chapter[] }) {
  return (
    <section id="juz" className="scroll-mt-24 pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div initial={{ x: -24 }} whileInView={{ x: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-semibold text-brand-secondary">Thirty parts</p>
          <h2 className="mt-2 text-display-sm font-display font-medium tracking-tight text-primary">Browse by juzʾ</h2>
        </motion.div>
        <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {JUZ_STARTS.map(([s, a], i) => (
            <motion.li
              key={i}
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
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
                  <Badge type="pill-color" size="sm" color="gray">
                    Juzʾ {i + 1}
                  </Badge>
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
