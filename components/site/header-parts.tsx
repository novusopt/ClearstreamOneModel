"use client";

import { BookOpen01, Bookmark, ChevronDown, Command, Globe02, LayersThree01, Menu02, PlayCircle, SearchLg } from "@untitledui/icons";
import Link from "next/link";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Kbd, openCommandPalette } from "@/components/site/command-palette";
import { LanguageFlag } from "@/components/site/language-flag";
import { Logo, LogoMark } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { ALL_LANGUAGES, type Lang } from "@/lib/i18n";
import { langFromPath, localizeHref, switchLanguagePath } from "@/lib/locale-path";
import type { ChromeMessages } from "@/lib/ui-messages";
import { cx } from "@/utils/cx";

export type HeaderStrings = ChromeMessages["header"];

export const navFor = (h: HeaderStrings, lang: Lang) => [
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
export function LanguageMenu({ label, pathname, full = false }: { label: string; pathname: string; /** Show the language's name (phone menu). */ full?: boolean }) {
  const current = langFromPath(pathname);
  const currentLang = ALL_LANGUAGES.find((l) => l.id === current) ?? ALL_LANGUAGES[0];
  const currentCode = currentLang.code;
  return (
    <Dropdown.Root>
      <Button
        size="sm"
        color={full ? "secondary" : "tertiary"}
        aria-label={full ? `${label}: ${currentLang.native}` : label}
        iconLeading={<LanguageFlag lang={current} />}
        iconTrailing={<ChevronDown data-icon aria-hidden="true" className={cx("size-4", !full && "hidden sm:block")} />}
        className="gap-1.5 px-2 sm:px-2.5"
      >
        {full ? (
          <span lang={currentCode} className="text-sm font-semibold">
            {currentLang.native}
          </span>
        ) : (
          <span className="hidden text-xs font-semibold tracking-wide uppercase sm:inline">{current}</span>
        )}
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

export function MobileMenu({ h, lang, due, readHref, readLabel, pathname }: { h: HeaderStrings; lang: Lang; due: number; readHref: string; readLabel: string; pathname: string }) {
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
                    <NavItemBase
                      type="link"
                      href="#"
                      icon={SearchLg}
                      onClick={(e) => {
                        e.preventDefault();
                        close();
                        openCommandPalette();
                      }}
                    >
                      {h.goTo}
                    </NavItemBase>
                  </li>
                </ul>
              </nav>
            </SlideoutMenu.Content>
            <SlideoutMenu.Footer className="flex flex-col gap-3">
              {/* On phones the bar only has room for search, Read and this menu: language and theme live here. */}
              <div className="flex items-center justify-between">
                <LanguageMenu label={h.language} pathname={pathname} full />
                <ThemeToggle />
              </div>
              <Button size="lg" href={readHref} iconLeading={PlayCircle} className="w-full" onPress={close}>
                {readLabel}
              </Button>
            </SlideoutMenu.Footer>
          </>
        )}
      </SlideoutMenu>
    </SlideoutMenu.Trigger>
  );
}


/** Shared state every header variant renders from. */
export interface HeaderCtx {
  h: HeaderStrings;
  lang: Lang;
  pathname: string;
  scrolled: boolean;
  due: number;
  lastRead: { surah: number; ayah: number } | null;
  readHref: string;
  readLabel: string;
  isCurrent: (href: string) => boolean;
}

/** Link to the localized home with the full logo (or only the mark). */
export function HomeLink({ ctx, markOnly = false, className }: { ctx: HeaderCtx; markOnly?: boolean; className?: string }) {
  return (
    <Link
      href={localizeHref(ctx.lang, "/")}
      className={cx("shrink-0 rounded-lg outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4", className)}
      aria-label={ctx.h.home}
    >
      {markOnly ? <LogoMark glow /> : <Logo />}
    </Link>
  );
}

/** Library due-review count, as an Untitled UI badge. */
export function DueBadge({ due, className }: { due: number; className?: string }) {
  if (due <= 0) return null;
  return (
    <Badge type="pill-color" color="brand" size="sm" className={className}>
      {due}
    </Badge>
  );
}

/** Search: an input-style trigger for the ⌘K palette (wide screens) and an icon button below `wideFrom`. */
export function SearchTrigger({ ctx, wideFrom = "xl", className, iconClassName }: { ctx: HeaderCtx; wideFrom?: "lg" | "xl" | "never"; className?: string; iconClassName?: string }) {
  const wideShow = wideFrom === "lg" ? "lg:inline-flex" : wideFrom === "xl" ? "xl:inline-flex" : "";
  const iconHide = wideFrom === "lg" ? "lg:hidden" : wideFrom === "xl" ? "xl:hidden" : "";
  return (
    <>
      {wideFrom !== "never" && (
        <Button
          size="sm"
          color="secondary"
          iconLeading={SearchLg}
          onPress={openCommandPalette}
          aria-label={ctx.h.goToLabel}
          className={cx("hidden w-56 justify-start [&_[data-text]]:flex [&_[data-text]]:flex-1 [&_[data-text]]:items-center", wideShow, className)}
        >
          <span className="flex-1 text-left font-normal text-placeholder">{ctx.h.goTo}</span>
          <Kbd icon={Command} label="Command K">
            K
          </Kbd>
        </Button>
      )}
      <ButtonUtility size="sm" color="tertiary" tooltip={ctx.h.goToLabel} tooltipPlacement="bottom" icon={SearchLg} onPress={openCommandPalette} className={cx(iconHide, iconClassName)} />
    </>
  );
}

/** The primary action: Start reading / Continue (with the saved position on wide screens). */
export function ReadButton({ ctx, className }: { ctx: HeaderCtx; className?: string }) {
  return (
    <Button size="sm" href={ctx.readHref} iconLeading={PlayCircle} className={cx("shadow-sm", className)}>
      <span className="hidden sm:inline">{ctx.readLabel}</span>
      {/* Icon-only on the narrowest phones; the name stays for screen readers. */}
      <span className="sm:hidden max-[379px]:sr-only">{ctx.h.read}</span>
      {ctx.lastRead && (
        <span className="hidden rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-medium tabular-nums lg:inline">
          {ctx.lastRead.surah}:{ctx.lastRead.ayah}
        </span>
      )}
    </Button>
  );
}

/** Language + theme (hidden on phones, where they live in the slideout menu). */
export function Preferences({ ctx, className }: { ctx: HeaderCtx; className?: string }) {
  return (
    <div className={cx("hidden items-center gap-1.5 sm:flex", className)}>
      <LanguageMenu label={ctx.h.language} pathname={ctx.pathname} />
      <ThemeToggle />
    </div>
  );
}

export function PhoneMenu({ ctx }: { ctx: HeaderCtx }) {
  return <MobileMenu h={ctx.h} lang={ctx.lang} due={ctx.due} readHref={ctx.readHref} readLabel={ctx.readLabel} pathname={ctx.pathname} />;
}
