"use client";

import { m, useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { HeaderCtx } from "@/components/site/header-parts";
import { useHeaderVariant } from "@/components/site/header-variants";
import { chromeStore } from "@/lib/chrome";
import type { Lang } from "@/lib/i18n";
import { dueReviews, useLibrary } from "@/lib/library";
import { langFromPath, localizeHref } from "@/lib/locale-path";
import type { ChromeMessages } from "@/lib/ui-messages";
import { cx } from "@/utils/cx";

/**
 * Site header: fixed, slides away while scrolling down and back on the way up. The bar itself is one
 * of the designs in header-variants.tsx (the default for everyone; /preview/header switches it).
 */
export function Header({ chrome }: { chrome: Record<Lang, ChromeMessages> }) {
  const pathname = usePathname() ?? "/";
  const lang = langFromPath(pathname);
  const h = chrome[lang].header;
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastRead = useLibrary((s) => s.lastRead);
  const due = useLibrary((s) => dueReviews(s).length);
  const variant = useHeaderVariant();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    const hide = y > 320 && y > prev + 4;
    const show = y < prev - 4;
    if (hide) setHidden(true);
    if (show) setHidden(false);
    if ((hide || show) && chromeStore.get().headerVisible !== show) chromeStore.set({ headerVisible: show });
  });

  const ctx: HeaderCtx = {
    h,
    lang,
    pathname,
    scrolled,
    due,
    lastRead,
    readHref: lastRead ? localizeHref(lang, `/surah/${lastRead.surah}#v-${lastRead.ayah}`) : lang === "en" ? "/surah/1" : `/surah/1?t=${lang}`,
    readLabel: lastRead ? h.continue : h.start,
    isCurrent: (href) => !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`)),
  };

  return (
    <m.header
      animate={{ y: hidden ? -variant.hide : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className={cx("fixed inset-x-0 top-0 z-40", variant.frame)}
    >
      <variant.Bar ctx={ctx} />
    </m.header>
  );
}
