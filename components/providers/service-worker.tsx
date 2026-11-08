"use client";

import { useEffect } from "react";
import { IS_ARTIFACT } from "@/lib/runtime";

/** Registers the offline service worker in production builds of the full app. */
export function ServiceWorker() {
  useEffect(() => {
    if (IS_ARTIFACT || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
