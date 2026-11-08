"use client";

import { ArrowDown, ArrowRight, ArrowUp, BookOpen01, Bookmark, CornerDownLeft, File06, Hash01, SearchLg } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { type FC, useEffect, useMemo, useState } from "react";
import { Heading as AriaHeading, ListBox as AriaListBox, ListBoxItem as AriaListBoxItem } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { createStore, useStore } from "@/lib/create-store";
import { useLibrary } from "@/lib/library";
import { DATA_BASE } from "@/lib/runtime";
import type { Chapter } from "@/lib/types";
import { normalizeArabic, normalizeLatin } from "@/lib/utils";
import { cx } from "@/utils/cx";

const paletteStore = createStore({ open: false });
export const openCommandPalette = () => paletteStore.set({ open: true });
const setOpen = (open: boolean) => paletteStore.set({ open });

/** [surah, ayah, english, normalisedArabic] — built by scripts/build-search-index.mjs. */
type IndexRow = [number, number, string, string];
let indexPromise: Promise<IndexRow[]> | null = null;
const loadIndex = () =>
  (indexPromise ??= fetch(`${DATA_BASE}/search.json`)
    .then((r) => (r.ok ? (r.json() as Promise<IndexRow[]>) : Promise.reject(new Error(r.statusText))))
    .catch((e) => {
      indexPromise = null;
      throw e;
    }));

function useSearchIndex(enabled: boolean): IndexRow[] | null {
  const [rows, setRows] = useState<IndexRow[] | null>(null);
  useEffect(() => {
    if (!enabled || rows) return;
    let live = true;
    loadIndex()
      .then((r) => live && setRows(r))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [enabled, rows]);
  return rows;
}

/** Short excerpt around the first match. */
function excerpt(text: string, needle: string): { before: string; match: string; after: string } {
  const i = text.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return { before: text.slice(0, 110), match: "", after: text.length > 110 ? "…" : "" };
  const start = Math.max(0, i - 50);
  return {
    before: (start > 0 ? "…" : "") + text.slice(start, i),
    match: text.slice(i, i + needle.length),
    after: text.slice(i + needle.length, i + needle.length + 70) + (i + needle.length + 70 < text.length ? "…" : ""),
  };
}

function searchAyat(query: string, rows: IndexRow[], chapters: Chapter[]): Result[] {
  const q = query.trim();
  const isArabic = /[\u0600-\u06FF]/.test(q);
  const needle = isArabic ? normalizeArabic(q) : q.toLowerCase();
  const out: Result[] = [];
  for (const [s, a, en, ar] of rows) {
    const hit = isArabic ? ar.includes(needle) : en.toLowerCase().includes(needle);
    if (!hit) continue;
    const ch = chapters[s - 1];
    out.push({
      id: `t-${s}-${a}`,
      href: `/surah/${s}#v-${a}`,
      title: `${ch.nameSimple} ${s}:${a}`,
      subtitle: "",
      snippet: isArabic ? undefined : excerpt(en, q),
      arabicSnippet: isArabic ? ar.slice(0, 90) : undefined,
      icon: File06,
    });
    if (out.length >= 30) break;
  }
  return out;
}

interface Result {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  icon: FC<{ className?: string }>;
  arabic?: string;
  badge?: string;
  snippet?: { before: string; match: string; after: string };
  arabicSnippet?: string;
}

function search(query: string, chapters: Chapter[], lastRead: { surah: number; ayah: number } | null): Result[] {
  const q = query.trim();
  const out: Result[] = [];

  // "2:255", "2 255" or "2.255" → jump to an ayah.
  const ref = q.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  if (ref) {
    const ch = chapters[Number(ref[1]) - 1];
    const ayah = Number(ref[2]);
    if (ch && ayah >= 1 && ayah <= ch.versesCount) {
      out.push({ id: `v-${ch.id}-${ayah}`, href: `/surah/${ch.id}#v-${ayah}`, title: `${ch.nameSimple} ${ch.id}:${ayah}`, subtitle: `Go to ayah ${ayah} of ${ch.versesCount}`, icon: Hash01, arabic: ch.nameArabic });
    }
  }

  if (!q) {
    if (lastRead) {
      const ch = chapters[lastRead.surah - 1];
      out.push({ id: "continue", href: `/surah/${ch.id}#v-${lastRead.ayah}`, title: "Continue reading", subtitle: `${ch.nameSimple} ${ch.id}:${lastRead.ayah}`, icon: BookOpen01 });
    }
    out.push({ id: "library", href: "/library", title: "Your library", subtitle: "Progress, reading plan, bookmarks, notes", icon: Bookmark });
  }

  const latin = normalizeLatin(q);
  const arabic = normalizeArabic(q);
  const matches = chapters.filter((c) => {
    if (!q) return [1, 18, 36, 55, 67].includes(c.id);
    if (/^\d+$/.test(q)) return String(c.id).startsWith(q);
    return (
      normalizeLatin(c.nameSimple).includes(latin) ||
      normalizeLatin(c.nameTranslation).includes(latin) ||
      (arabic.length > 0 && normalizeArabic(c.nameArabic).includes(arabic))
    );
  });
  for (const c of matches.slice(0, 8)) {
    out.push({
      id: `s-${c.id}`,
      href: `/surah/${c.id}`,
      title: `${c.id}. ${c.nameSimple}`,
      subtitle: `${c.nameTranslation} · ${c.versesCount} ayat`,
      icon: ArrowRight,
      arabic: c.nameArabic,
      badge: c.revelation === "meccan" ? "Meccan" : "Medinan",
    });
  }
  return out;
}

/** ⌘K / Ctrl+K quick navigation to any surah or ayah. */
export function CommandPalette({ chapters }: { chapters: Chapter[] }) {
  const open = useStore(paletteStore, (s) => s.open, { open: false });
  const router = useRouter();
  const lastRead = useLibrary((s) => s.lastRead);
  const [query, setQuery] = useState("");
  const q = query.trim();
  const wantsText = q.length >= 3 && !/^\d/.test(q);
  const rows = useSearchIndex(open && wantsText);
  const results = useMemo(() => {
    const base = search(query, chapters, lastRead);
    return wantsText && rows ? [...base, ...searchAyat(query, rows, chapters)] : base;
  }, [query, chapters, lastRead, rows, wantsText]);
  const textLoading = wantsText && !rows;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!paletteStore.get().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <ModalOverlay
      isDismissable
      isOpen={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
      className="items-start sm:items-start sm:pt-[12vh]"
    >
      <Modal className="max-w-xl overflow-hidden">
        <Dialog aria-label="Go to surah or ayah">
          <div className="border-b border-secondary p-4">
            <AriaHeading slot="title" className="sr-only">
              Go to surah or ayah
            </AriaHeading>
            <Input
              autoFocus
              size="md"
              icon={SearchLg}
              aria-label="Search surahs and ayat, or type a reference like 2:255"
              placeholder="Search surahs, ayat or type 2:255"
              value={query}
              onChange={setQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) go(results[0].href);
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  document.querySelector<HTMLElement>("#palette-results [role=option]")?.focus();
                }
              }}
            />
          </div>
          {textLoading && <p className="px-6 pt-3 text-xs text-tertiary">Searching all 6,236 ayat…</p>}
          {results.length > 0 ? (
            <AriaListBox
              id="palette-results"
              aria-label="Results"
              items={results}
              selectionMode="none"
              onAction={(key) => {
                const r = results.find((x) => x.id === key);
                if (r) go(r.href);
              }}
              className="max-h-[50vh] overflow-y-auto p-2 outline-hidden"
            >
              {(r) => (
                <AriaListBoxItem
                  id={r.id}
                  textValue={r.title}
                  className={({ isFocused }) =>
                    cx("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-hidden transition-colors", isFocused && "bg-primary_hover")
                  }
                >
                  {({ isFocused }) => (
                    <>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-secondary">
                        <r.icon className="size-4 text-fg-quaternary" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-primary">{r.title}</span>
                        {r.snippet ? (
                          <span className="line-clamp-2 text-xs text-tertiary">
                            {r.snippet.before}
                            <mark className="rounded bg-gold-200/70 px-0.5 text-primary dark:bg-gold-500/30">{r.snippet.match}</mark>
                            {r.snippet.after}
                          </span>
                        ) : r.arabicSnippet ? (
                          <span lang="ar" dir="rtl" className="block truncate font-quran text-lg text-tertiary">
                            {r.arabicSnippet}
                          </span>
                        ) : (
                          <span className="block truncate text-xs text-tertiary">{r.subtitle}</span>
                        )}
                      </span>
                      {r.badge && (
                        <Badge type="modern" size="sm" color="gray" className="hidden sm:flex">
                          {r.badge}
                        </Badge>
                      )}
                      {r.arabic && (
                        <span lang="ar" dir="rtl" className="font-quran text-xl text-secondary">
                          {r.arabic}
                        </span>
                      )}
                      <CornerDownLeft aria-hidden="true" className={cx("size-4 text-fg-quaternary", !isFocused && "invisible")} />
                    </>
                  )}
                </AriaListBoxItem>
              )}
            </AriaListBox>
          ) : (
            <p className="px-6 py-10 text-center text-sm text-tertiary">
              {textLoading ? "Searching…" : `Nothing matches “${query}”. Try a surah name, a reference like 18:10, or a word such as “patience” or “صبر”.`}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-secondary bg-secondary px-4 py-2.5 text-xs text-tertiary">
            <span>
              <Kbd icon={CornerDownLeft} label="Enter" /> open
            </span>
            <span>
              <Kbd icon={ArrowDown} label="Down arrow" /> <Kbd icon={ArrowUp} label="Up arrow" /> move
            </span>
            <span>
              <Kbd>esc</Kbd> close
            </span>
            <span className="ml-auto hidden sm:inline">
              In a surah: <Kbd>Space</Kbd> play · <Kbd>J</Kbd> next · <Kbd>K</Kbd> previous
            </span>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

/** Keyboard key hint. Symbol keys use Untitled UI icons (with an accessible label) rather than glyphs. */
export function Kbd({ children, icon: Icon, label }: { children?: React.ReactNode; icon?: FC<{ className?: string }>; label?: string }) {
  return (
    <kbd
      aria-label={label}
      className="inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded border border-secondary bg-primary px-1 font-sans text-[11px] font-medium text-secondary shadow-xs"
    >
      {Icon && <Icon aria-hidden="true" className="size-3" />}
      {children}
    </kbd>
  );
}
