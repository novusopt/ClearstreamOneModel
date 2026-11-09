"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

/** Ayat rendered up front (server HTML and first paint). */
const INITIAL = 24;
/** Ayat appended per idle slice afterwards. */
const BATCH = 20;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Progressive list rendering for long surahs. Al-Baqarah has 6,000+ interactive words; rendering
 * and hydrating them in one go blocks the main thread for seconds on a phone. This renders the
 * first `INITIAL` items immediately and appends the rest in small batches while the browser is
 * idle, as a transition, so input stays responsive. `ensure(n)` renders at least `n` items at once
 * (deep links, resume, following the recitation).
 */
export function useProgressiveCount(total: number) {
  const [count, setCount] = useState(() => Math.min(total, INITIAL));

  useEffect(() => {
    if (count >= total) return;
    const w = window as IdleWindow;
    const grow = () => startTransition(() => setCount((c) => Math.min(total, c + BATCH)));
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(grow, { timeout: 500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(grow, 32);
    return () => window.clearTimeout(id);
  }, [count, total]);

  const ensure = useCallback((n: number) => setCount((c) => (c >= n ? c : Math.min(total, n))), [total]);
  return { count, ensure, done: count >= total };
}
