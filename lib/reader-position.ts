"use client";

import { createStore, useStore } from "@/lib/create-store";

/** The ayah currently on the reading line (updates immediately, unlike read tracking). */
const INITIAL = { surah: 0, ayah: 0 };
export const positionStore = createStore(INITIAL);
export const useReaderPosition = <S,>(sel: (s: typeof INITIAL) => S) => useStore(positionStore, sel, INITIAL);
