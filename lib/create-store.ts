"use client";

import { useSyncExternalStore } from "react";

export interface Store<T> {
  get: () => T;
  set: (next: Partial<T> | ((prev: T) => Partial<T>)) => void;
  subscribe: (fn: () => void) => () => void;
}

/**
 * Tiny external store. With `persistKey`, state is mirrored to localStorage and
 * the server snapshot is always `initial`, so SSR output is deterministic.
 */
export function createStore<T extends object>(initial: T, persistKey?: string): Store<T> {
  let state = initial;
  let hydrated = !persistKey;
  const listeners = new Set<() => void>();

  const hydrate = () => {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(persistKey!);
      if (raw) state = { ...initial, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      // Storage unavailable (private mode) — keep defaults.
    }
  };

  return {
    get: () => {
      hydrate();
      return state;
    },
    set: (next) => {
      hydrate();
      const patch = typeof next === "function" ? next(state) : next;
      state = { ...state, ...patch };
      if (persistKey) {
        try {
          window.localStorage.setItem(persistKey, JSON.stringify(state));
        } catch {
          // ignore quota / privacy errors
        }
      }
      listeners.forEach((l) => l());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function useStore<T extends object, S>(store: Store<T>, selector: (s: T) => S, serverState?: T): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(serverState ?? store.get()),
  );
}
