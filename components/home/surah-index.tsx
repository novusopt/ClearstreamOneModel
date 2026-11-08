"use client";

import { LayoutGrid01, List, SearchLg } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { JUZ_STARTS } from "@/lib/constants";
import { useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";
import { normalizeArabic, normalizeLatin, toArabicNumber } from "@/lib/utils";
import { cx } from "@/utils/cx";

type Filter = "all" | "meccan" | "medinan";
type View = "niches" | "index";

/** Small eight-point star holding a Latin number (surah index). */
function StarNumber({ n, className }: { n: number; className?: string }) {
  const sq = { x: 9.5, y: 9.5, width: 29, height: 29, rx: 2.5 };
  const label = String(n);
  return (
    <span className={cx("relative inline-grid size-10 shrink-0 place-items-center", className)} aria-hidden="true">
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full overflow-visible transition-transform duration-700 ease-out group-hover:rotate-45">
        <g className="stroke-gold-500/80" strokeWidth="2.5" fill="none">
          <rect {...sq} />
          <rect {...sq} transform="rotate(45 24 24)" />
        </g>
        <g className="fill-bg-primary transition-colors duration-500 group-hover:fill-gold-100 dark:group-hover:fill-gold-600/30">
          <rect {...sq} />
          <rect {...sq} transform="rotate(45 24 24)" />
        </g>
      </svg>
      <span className={cx("relative font-display font-medium text-gold-700 tabular-nums dark:text-gold-300", label.length >= 3 ? "text-[11px]" : "text-xs")}>
        {label}
      </span>
    </span>
  );
}

function useReadPct(chapter: Chapter) {
  const readCount = useLibrary((st) => st.read[chapter.id]?.length ?? 0);
  return Math.round((readCount / chapter.versesCount) * 100);
}

/**
 * A surah as a niche (mishkāh): arched tile, Arabic name as the hero, reading progress shown as
 * lantern light rising from the bottom.
 */
function SurahNiche({ chapter, i }: { chapter: Chapter; i: number }) {
  const pct = useReadPct(chapter);
  const meccan = chapter.revelation === "meccan";
  return (
    <motion.li
      layout
      initial={{ y: 28, scale: 0.97 }}
      whileInView={{ y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.55, delay: (i % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/surah/${chapter.id}`}
        aria-label={`${chapter.id}. ${chapter.nameSimple}, ${chapter.nameTranslation}. ${chapter.versesCount} ayat, ${meccan ? "Meccan" : "Medinan"}${pct ? `, ${pct}% read` : ""}`}
        className={cx(
          "group relative flex h-full flex-col items-center overflow-hidden rounded-t-[999px] rounded-b-2xl border bg-primary_alt px-3 pt-5 pb-4 text-center outline-focus-ring",
          "transition duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2",
          meccan ? "border-gold-400/40 hover:border-gold-400" : "border-brand-300/50 hover:border-brand-400 dark:border-brand-700/60",
        )}
      >
        {/* Inner arch line. */}
        <span
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-1.5 rounded-t-[999px] rounded-b-xl border border-dashed transition-colors duration-500",
            meccan ? "border-gold-400/25 group-hover:border-gold-400/50" : "border-brand-300/30 group-hover:border-brand-400/50 dark:border-brand-700/40",
          )}
        />
        {/* Lamp glow that brightens on hover. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-6 mx-auto size-28 rounded-full bg-gold-300/0 blur-2xl transition-colors duration-700 group-hover:bg-gold-300/45 dark:group-hover:bg-gold-500/20"
        />
        {/* Reading progress as rising light. */}
        {pct > 0 && (
          <motion.span
            aria-hidden="true"
            initial={{ height: 0 }}
            whileInView={{ height: `${Math.max(pct, 6)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-gold-300/45 via-gold-200/20 to-transparent dark:from-gold-500/25 dark:via-gold-500/10"
          />
        )}

        <StarNumber n={chapter.id} className="relative" />
        <span
          lang="ar"
          dir="rtl"
          className={cx(
            "relative mt-2 font-quran text-3xl leading-[1.6] sm:mt-3 sm:text-4xl transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-105",
            meccan ? "text-gold-700 dark:text-gold-300" : "text-brand-secondary",
          )}
        >
          {chapter.nameArabic}
        </span>
        <span className="relative mt-auto pt-2 font-display text-md leading-tight font-medium text-primary">{chapter.nameSimple}</span>
        <span className="relative mt-0.5 line-clamp-1 text-xs text-tertiary">{chapter.nameTranslation}</span>
        <span className="relative mt-2 flex items-center gap-1.5 text-[11px] font-medium text-quaternary tabular-nums">
          <span className={cx("size-1.5 rounded-full", meccan ? "bg-gold-500" : "bg-brand-500")} aria-hidden="true" />
          {chapter.versesCount} ayat
          {pct > 0 && <span className="text-gold-600 dark:text-gold-400">· {pct}%</span>}
        </span>
      </Link>
    </motion.li>
  );
}

/** Table-of-contents (fihris) row: number, names joined by a dotted leader, ayah count. */
function SurahIndexRow({ chapter, i }: { chapter: Chapter; i: number }) {
  const pct = useReadPct(chapter);
  const meccan = chapter.revelation === "meccan";
  return (
    <motion.li
      layout
      initial={{ x: -12 }}
      whileInView={{ x: 0 }}
      exit={{ opacity: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (i % 10) * 0.02 }}
      className="break-inside-avoid"
    >
      <Link
        href={`/surah/${chapter.id}`}
        className="group relative flex items-center gap-3 rounded-xl px-2 py-2.5 outline-focus-ring transition-colors hover:bg-primary_hover focus-visible:outline-2"
      >
        <StarNumber n={chapter.id} className="size-9" />
        <span className="min-w-0 shrink">
          <span className="block truncate font-display text-md font-medium text-primary group-hover:text-brand-secondary">{chapter.nameSimple}</span>
          <span className="block truncate text-xs text-tertiary">{chapter.nameTranslation}</span>
        </span>
        <span aria-hidden="true" className="mb-1 min-w-6 flex-1 self-end border-b-2 border-dotted border-secondary transition-colors group-hover:border-gold-400" />
        <span className="flex shrink-0 flex-col items-end">
          <span lang="ar" dir="rtl" className={cx("font-quran text-2xl leading-tight", meccan ? "text-gold-700 dark:text-gold-300" : "text-brand-secondary")}>
            {chapter.nameArabic}
          </span>
          <span className="text-[11px] text-quaternary tabular-nums">
            {chapter.versesCount} ayat{pct > 0 ? ` · ${pct}% read` : ""}
          </span>
        </span>
        {pct > 0 && (
          <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full">
            <span className="block h-full rounded-full bg-gold-400" style={{ width: `${pct}%` }} />
          </span>
        )}
      </Link>
    </motion.li>
  );
}

export function SurahIndex({ chapters }: { chapters: Chapter[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("niches");
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
              placeholder="Name, meaning or number"
              icon={SearchLg}
              value={query}
              onChange={setQuery}
              className="sm:w-80"
              type="search"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gold-500" aria-hidden="true" /> Meccan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-brand-500" aria-hidden="true" /> Medinan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-2 rounded-sm bg-gradient-to-t from-gold-400 to-transparent" aria-hidden="true" /> Light rises as you read
            </span>
            <span className="tabular-nums">{results.length} of 114</span>
          </p>
          <ButtonGroup size="sm" selectedKeys={[view]} disallowEmptySelection onSelectionChange={(k) => setView([...k][0] as View)} aria-label="Layout">
            <ButtonGroupItem id="niches" iconLeading={LayoutGrid01}>
              Niches
            </ButtonGroupItem>
            <ButtonGroupItem id="index" iconLeading={List}>
              Contents
            </ButtonGroupItem>
          </ButtonGroup>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {view === "niches" ? (
            <motion.ul
              key="niches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6"
            >
              <AnimatePresence mode="popLayout">
                {results.map((c, i) => (
                  <SurahNiche key={c.id} chapter={c} i={i} />
                ))}
              </AnimatePresence>
            </motion.ul>
          ) : (
            <motion.ol
              key="index"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 gap-x-10 rounded-3xl border border-secondary bg-primary_alt p-3 sm:p-5 md:columns-2 xl:columns-3"
            >
              <AnimatePresence mode="popLayout">
                {results.map((c, i) => (
                  <SurahIndexRow key={c.id} chapter={c} i={i} />
                ))}
              </AnimatePresence>
            </motion.ol>
          )}
        </AnimatePresence>
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
