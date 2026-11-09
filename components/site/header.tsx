"use client";

import { BookOpen01, Bookmark, ChevronDown, Command, Globe02, LayersThree01, Menu02, PlayCircle, SearchLg } from "@untitledui/icons";
import { m, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavButton } from "@/components/application/app-navigation/base-components/nav-button";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Kbd, openCommandPalette } from "@/components/site/command-palette";
import { LanguageFlag } from "@/components/site/language-flag";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { chromeStore } from "@/lib/chrome";
import { ALL_LANGUAGES, type Lang } from "@/lib/i18n";
import { dueReviews, useLibrary } from "@/lib/library";
import { langFromPath, localizeHref, switchLanguagePath } from "@/lib/locale-path";
import type { ChromeMessages } from "@/lib/ui-messages";
import { cx } from "@/utils/cx";

type HeaderStrings = ChromeMessages["header"];

const navFor = (h: HeaderStrings, lang: Lang) => [
  { href: localizeHref(lang, "/#surahs"), label: h.surahs, icon: BookOpen01 },
  { href: localizeHref(lang, "/#juz"), label: h.juz, icon: LayersThree01 },
  { href: "/library", label: h.library, icon: Bookmark },
];

/** Name of a language in the visitor's language ("espagnol" on French pages), via Intl. */
function displayName(code: string, uiLang: string) {
  try {
    return new Intl.DisplayNames([uiLang], { type: "language" }).of(code) ?? "";
  } catch {
    return "";
  }
}

/**
 * Language switcher: a flag pill showing the current language; the menu lists every language with its
 * flag, its own name and its name in the visitor's language, and opens the same page in that language
 * where one exists (else that language's home).
 */
function LanguageMenu({ label, pathname }: { label: string; pathname: string }) {
  const current = langFromPath(pathname);
  const currentLang = ALL_LANGUAGES.find((l) => l.id === current) ?? ALL_LANGUAGES[0];
  const currentCode = currentLang.code;
  return (
    <Dropdown.Root>
      <Button
        size="sm"
        color="tertiary"
        aria-label={label}
        iconLeading={<LanguageFlag lang={current} />}
        iconTrailing={<ChevronDown data-icon aria-hidden="true" className="hidden size-4 sm:block" />}
        className="gap-1.5 px-2 sm:px-2.5"
      >
        <span className="hidden text-xs font-semibold tracking-wide uppercase sm:inline">{current}</span>
      </Button>
      <Dropdown.Popover className="w-[min(30rem,calc(100vw-1.5rem))]" placement="bottom end">
        <div className="flex items-center gap-2.5 border-b border-secondary px-4 py-3">
          <span className="flex size-8 items-center justify-center rounded-lg border border-secondary bg-secondary text-fg-secondary">
            <Globe02 aria-hidden="true" className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-primary">{label}</span>
            <span lang={currentCode} className="text-xs text-tertiary">
              {currentLang.native}
            </span>
          </span>
        </div>
        <Dropdown.Menu aria-label={label} selectionMode="single" selectedKeys={[current]} className="grid max-h-[min(30rem,70vh)] grid-cols-1 overflow-y-auto py-1.5 sm:grid-cols-2">
          {ALL_LANGUAGES.map((l) => {
            const local = displayName(l.code, currentCode);
            return (
              <Dropdown.Item key={l.id} id={l.id} href={switchLanguagePath(pathname, l.id)} hrefLang={l.code} textValue={l.native} selectionIndicator="checkmark">
                <span className="flex items-center gap-3">
                  <LanguageFlag lang={l.id} className="size-6" />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span lang={l.code} className="truncate text-sm font-semibold text-primary">
                      {l.native}
                    </span>
                    <span className="truncate text-xs font-normal text-tertiary">
                      {local && local.toLocaleLowerCase() !== l.native.toLocaleLowerCase() ? local : l.code.toUpperCase()}
                    </span>
                  </span>
                </span>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

function MobileMenu({ h, lang, due, readHref }: { h: HeaderStrings; lang: Lang; due: number; readHref: string }) {
  return (
    <SlideoutMenu.Trigger>
      <ButtonUtility size="sm" color="tertiary" tooltip={h.openMenu} tooltipPlacement="bottom" icon={Menu02} className="md:hidden" />
      <SlideoutMenu isDismissable className="z-50">
        {({ close }) => (
          <>
            <SlideoutMenu.Header onClose={close}>
              <Logo />
            </SlideoutMenu.Header>
            <SlideoutMenu.Content>
              <nav aria-label="Mobile">
                <ul className="flex flex-col gap-1">
                  {navFor(h, lang).map((n) => (
                    <li key={n.href}>
                      <NavItemBase
                        type="link"
                        href={n.href}
                        icon={n.icon}
                        onClick={close}
                        badge={
                          n.href === "/library" && due > 0 ? (
                            <Badge type="pill-color" color="brand" size="sm">
                              {due}
                            </Badge>
                          ) : undefined
                        }
                      >
                        {n.label}
                      </NavItemBase>
                    </li>
                  ))}
                  <li>
                    <NavItemBase type="link" href="#" icon={SearchLg} onClick={() => (close(), openCommandPalette())}>
                      {h.goTo}
                    </NavItemBase>
                  </li>
                </ul>
              </nav>
            </SlideoutMenu.Content>
            <SlideoutMenu.Footer>
              <Button size="lg" href={readHref} iconLeading={BookOpen01} className="w-full" onPress={close}>
                {h.start}
              </Button>
            </SlideoutMenu.Footer>
          </>
        )}
      </SlideoutMenu>
    </SlideoutMenu.Trigger>
  );
}

export function Header({ chrome }: { chrome: Record<Lang, ChromeMessages> }) {
  const pathname = usePathname() ?? "/";
  const lang = langFromPath(pathname);
  const h = chrome[lang].header;
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastRead = useLibrary((s) => s.lastRead);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    const hide = y > 320 && y > prev + 4;
    const show = y < prev - 4;
    if (hide) setHidden(true);
    if (show) setHidden(false);
    if ((hide || show) && chromeStore.get().headerVisible !== show) chromeStore.set({ headerVisible: show });
  });

  const due = useLibrary((s) => dueReviews(s).length);
  const readHref = lastRead ? localizeHref(lang, `/surah/${lastRead.surah}#v-${lastRead.ayah}`) : lang === "en" ? "/surah/1" : `/surah/1?t=${lang}`;
  const isCurrent = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <m.header
      animate={{ y: hidden ? -96 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-6"
    >
      <div
        className={cx(
          "mx-auto flex h-16 max-w-7xl items-center gap-3 rounded-2xl px-3 ring-1 backdrop-blur-xl transition-all duration-300 md:px-4",
          scrolled ? "bg-primary/80 shadow-lg ring-secondary_alt" : "bg-primary/40 ring-secondary_alt/60",
        )}
      >
        <Link href={localizeHref(lang, "/")} className="shrink-0 rounded-lg outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={h.home}>
          <Logo />
        </Link>

        {/* Primary navigation: Untitled UI nav buttons in a segmented tray. */}
        <nav aria-label="Main" className="ml-2 hidden md:block lg:ml-6">
          <ul className="flex items-center gap-0.5 rounded-xl bg-secondary/70 p-1 ring-1 ring-secondary ring-inset">
            {navFor(h, lang).map((n) => (
              <li key={n.href}>
                <NavButton
                  href={n.href}
                  icon={n.icon}
                  current={isCurrent(n.href)}
                  className="rounded-lg data-[current]:bg-primary aria-[current=page]:bg-primary aria-[current=page]:shadow-xs"
                >
                  {n.label}
                  {n.href === "/library" && due > 0 && (
                    <Badge type="pill-color" color="brand" size="sm">
                      {due}
                    </Badge>
                  )}
                </NavButton>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Search: an Untitled UI input-style trigger for the ⌘K palette. */}
          <Button
            size="sm"
            color="secondary"
            iconLeading={SearchLg}
            onPress={openCommandPalette}
            aria-label={h.goToLabel}
            className="hidden w-56 justify-start xl:inline-flex [&_[data-text]]:flex [&_[data-text]]:flex-1 [&_[data-text]]:items-center"
          >
            <span className="flex-1 text-left font-normal text-placeholder">{h.goTo}</span>
            <Kbd icon={Command} label="Command K">
              K
            </Kbd>
          </Button>
          <ButtonUtility size="sm" color="tertiary" tooltip={h.goToLabel} tooltipPlacement="bottom" icon={SearchLg} onPress={openCommandPalette} className="xl:hidden" />
          <LanguageMenu label={h.language} pathname={pathname} />
          <ThemeToggle />
          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border-secondary sm:block" />
          <Button size="sm" href={readHref} iconLeading={PlayCircle} className="shadow-sm">
            <span className="hidden sm:inline">{lastRead ? h.continue : h.start}</span>
            <span className="sm:hidden">{h.read}</span>
            {lastRead && (
              <span className="hidden rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-medium tabular-nums lg:inline">
                {lastRead.surah}:{lastRead.ayah}
              </span>
            )}
          </Button>
          <MobileMenu h={h} lang={lang} due={due} readHref={readHref} />
        </div>
      </div>
    </m.header>
  );
}
