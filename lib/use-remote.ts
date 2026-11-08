"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, Promise<unknown>>();
const resolved = new Map<string, unknown>();

/** Fetch JSON once per URL (shared cache), returning null until it arrives or if it fails. */
export function useRemote<T>(url: string | null): T | null {
  const [, force] = useState(0);
  useEffect(() => {
    if (!url || resolved.has(url)) return;
    let live = true;
    if (!cache.has(url)) {
      cache.set(
        url,
        fetch(url)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
          .then((d) => {
            resolved.set(url, d);
            return d;
          })
          .catch((e) => {
            cache.delete(url);
            throw e;
          }),
      );
    }
    cache
      .get(url)!
      .then(() => live && force((n) => n + 1))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [url]);
  return url ? ((resolved.get(url) as T | undefined) ?? null) : null;
}

export function fetchJson<T>(url: string): Promise<T> {
  if (resolved.has(url)) return Promise.resolve(resolved.get(url) as T);
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
        .then((d) => {
          resolved.set(url, d);
          return d;
        }),
    );
  }
  return cache.get(url) as Promise<T>;
}
