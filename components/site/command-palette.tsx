"use client";

import { type FC, lazy, Suspense, useEffect, useState } from "react";
import { createStore, useStore } from "@/lib/create-store";
import type { Chapter } from "@/lib/types";

export const paletteStore = createStore({ open: false });
export const openCommandPalette = () => paletteStore.set({ open: true });
export const setPaletteOpen = (open: boolean) => paletteStore.set({ open });

// The dialog (React Aria ListBox, Modal, search) is only downloaded the first time it opens.
const CommandPaletteDialog = lazy(() => import("@/components/site/command-palette-dialog"));

/** ⌘K / Ctrl+K quick navigation to any surah or ayah. Registers the shortcut; loads the dialog on demand. */
export function CommandPalette({ chapters }: { chapters: Chapter[] }) {
  const open = useStore(paletteStore, (s) => s.open, { open: false });
  const [loaded, setLoaded] = useState(false);
  if (open && !loaded) setLoaded(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteStore.get().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!loaded) return null;
  return (
    <Suspense fallback={null}>
      <CommandPaletteDialog chapters={chapters} />
    </Suspense>
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
