"use client";

import { createStore, useStore } from "@/lib/create-store";

/** Shared page-chrome state: whether the site header is currently shown. */
const INITIAL = { headerVisible: true };
export const chromeStore = createStore(INITIAL);
export const useChrome = <S,>(sel: (s: typeof INITIAL) => S) => useStore(chromeStore, sel, INITIAL);
