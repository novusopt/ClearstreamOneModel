"use client";

import { useEffect } from "react";

/**
 * Localized pages live under the shared root layout (html lang="en"), so this sets the document
 * language for the page's lifetime and restores it when leaving. Direction is set on the page's own
 * container (lang/dir there are also what the server HTML exposes), so the English site header and
 * footer keep their layout on right-to-left pages.
 */
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.lang;
    html.lang = lang;
    return () => {
      html.lang = prev;
    };
  }, [lang]);
  return null;
}
