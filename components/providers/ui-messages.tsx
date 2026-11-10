"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { Lang } from "@/lib/i18n";
import { localizeHref } from "@/lib/locale-path";
import type { Messages } from "@/lib/ui-messages/en";

interface UiValue {
  lang: Lang;
  m: Messages;
  /** Localize an internal href for this language (see lib/locale-path.ts). */
  href: (path: string) => string;
  /** Al-Fatihah's translation in this language (home demos), one string per ayah. */
  fatihah?: string[];
}

const UiContext = createContext<UiValue | null>(null);

/** Supplies one language's page copy to the client components below it (home page sections). */
export function UiProvider({ lang, messages, fatihah, children }: { lang: Lang; messages: Messages; fatihah?: string[]; children: ReactNode }) {
  const value = useMemo(() => ({ lang, m: messages, fatihah, href: (p: string) => localizeHref(lang, p) }), [lang, messages, fatihah]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiValue {
  const v = useContext(UiContext);
  if (!v) throw new Error("useUi() needs a <UiProvider> (home sections are rendered inside one).");
  return v;
}
