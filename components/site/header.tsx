"use client";

import { m, useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavButton } from "@/components/application/app-navigation/base-components/nav-button";
import {
  DueBadge,
  type HeaderCtx,
  HomeLink,
  navFor,
  PhoneMenu,
  Preferences,
  ReadButton,
  SearchTrigger,
} from "@/components/site/header-parts";
import { chromeStore } from "@/lib/chrome";
import type { Lang } from "@/lib/i18n";
import { dueReviews, useLibrary } from "@/lib/library";
import { langFromPath, localizeHref } from "@/lib/locale-path";
import type { ChromeMessages } from "@/lib/ui-messages";
import { cx } from "@/utils/cx";

/**
 * Site header (Untitled UI header navigation): a full-width bar with a hairline, the current page
 * underlined. Fixed at the top; slides away while scrolling down and back on the way up.
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
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed inset-x-0 top-0 z-40"
    >
      <div
        className={cx(
          "border-b transition-colors duration-300",
          scrolled ? "border-secondary bg-primary/90 shadow-xs backdrop-blur-xl" : "border-secondary/60 bg-primary/70 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 md:gap-8 md:px-8">
          <HomeLink ctx={ctx} />
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-0.5">
              {navFor(h, lang).map((n) => {
                const current = ctx.isCurrent(n.href);
                return (
                  <li key={n.href} className="relative">
                    <NavButton href={n.href} icon={n.icon} current={current}>
                      {n.label}
                      {n.href === "/library" && <DueBadge due={due} />}
                    </NavButton>
                    {/* The current page is underlined, sitting on the bar's hairline. */}
                    {current && <span aria-hidden="true" className="absolute inset-x-2 -bottom-[19px] h-0.5 rounded-full bg-fg-brand-primary" />}
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <SearchTrigger ctx={ctx} wideFrom="lg" className="w-64" />
            <Preferences ctx={ctx} />
            <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border-secondary sm:block" />
            <ReadButton ctx={ctx} />
            <PhoneMenu ctx={ctx} />
          </div>
        </div>
      </div>
    </m.header>
  );
}
