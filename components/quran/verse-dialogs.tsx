"use client";

import { lazy, Suspense, useState } from "react";
import { createStore, useStore } from "@/lib/create-store";
import type { SimilarRef } from "@/lib/types";

export interface DialogTarget {
  kind: "note" | "image" | "similar" | null;
  surah: number;
  ayah: number;
  surahName: string;
  arabic: string;
  translation: string;
  similar?: SimilarRef[];
}

export const EMPTY_DIALOG: DialogTarget = { kind: null, surah: 0, ayah: 0, surahName: "", arabic: "", translation: "" };
export const dialogStore = createStore<DialogTarget>(EMPTY_DIALOG);

export const openVerseDialog = (target: Omit<DialogTarget, "kind">, kind: "note" | "image" | "similar") => dialogStore.set({ ...target, kind });
export const closeVerseDialog = () => dialogStore.set({ kind: null });

// Modal, note editor, share-image canvas and the similar-ayat comparison load on first use.
const VerseDialogsContent = lazy(() => import("@/components/quran/verse-dialogs-content"));

/** One shared instance per page: the note editor, the share-as-image card and similar ayat. */
export function VerseDialogs() {
  const opened = useStore(dialogStore, (s) => s.kind != null, EMPTY_DIALOG);
  const [loaded, setLoaded] = useState(false);
  if (opened && !loaded) setLoaded(true);
  if (!loaded) return null;
  return (
    <Suspense fallback={null}>
      <VerseDialogsContent />
    </Suspense>
  );
}
