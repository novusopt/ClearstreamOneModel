"use client";

import { ArrowRight, BookOpen01, Bookmark, CornerDownLeft, Hash01, SearchLg } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { type FC, useEffect, useMemo, useState } from "react";
import { Heading as AriaHeading, ListBox as AriaListBox, ListBoxItem as AriaListBoxItem } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { createStore, useStore } from "@/lib/create-store";
import { useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";
import { normalizeArabic, normalizeLatin } from "@/lib/utils";
import { cx } from "@/utils/cx";

const paletteStore = createStore({ open: false });
export const openCommandPalette = () => paletteStore.set({ open: true });
const setOpen = (open: boolean) => paletteStore.set({ open });

interface Result {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  icon: FC<{ className?: string }>;
  arabic?: string;
  badge?: string;
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
    out.push({ id: "bookmarks", href: "/bookmarks", title: "Bookmarks", subtitle: "Your saved ayat", icon: Bookmark });
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
  const results = useMemo(() => search(query, chapters, lastRead), [query, chapters, lastRead]);

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
              aria-label="Search surahs or type a reference like 2:255"
              placeholder="Search surahs or type 2:255"
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
                        <span className="block truncate text-xs text-tertiary">{r.subtitle}</span>
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
            <p className="px-6 py-10 text-center text-sm text-tertiary">No surah matches “{query}”. Try a name, a number, or a reference like 18:10.</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-secondary bg-secondary px-4 py-2.5 text-xs text-tertiary">
            <span>
              <Kbd>↵</Kbd> open
            </span>
            <span>
              <Kbd>↓</Kbd> <Kbd>↑</Kbd> move
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

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-secondary bg-primary px-1 font-sans text-[11px] font-medium text-secondary shadow-xs">
      {children}
    </kbd>
  );
}
