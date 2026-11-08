"use client";

import Lenis from "lenis";
import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { IS_ARTIFACT } from "@/lib/runtime";

let current: Lenis | null = null;
const listeners = new Set<() => void>();
const setCurrent = (l: Lenis | null) => {
  current = l;
  listeners.forEach((fn) => fn());
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useLenis = () =>
  useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );

/** Buttery inertial scrolling (disabled when the user prefers reduced motion). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // In the hash-routed build, anchors are handled by the app router instead.
    const instance = new Lenis({ autoRaf: true, lerp: 0.12, anchors: IS_ARTIFACT ? false : { offset: -96 } });
    setCurrent(instance);
    return () => {
      instance.destroy();
      setCurrent(null);
    };
  }, []);

  return <>{children}</>;
}

/** Scroll an element into view, using Lenis when it is active. */
export function scrollToElement(lenis: Lenis | null, el: HTMLElement, offset = -140) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.1 });
  else {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}
