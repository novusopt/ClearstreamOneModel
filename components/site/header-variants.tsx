"use client";

import type { ReactNode } from "react";
import { NavButton } from "@/components/application/app-navigation/base-components/nav-button";
import { Button } from "@/components/base/buttons/button";
import { Kbd, openCommandPalette } from "@/components/site/command-palette";
import { Command, SearchLg } from "@untitledui/icons";
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
import { createStore, useStore } from "@/lib/create-store";
import { cx } from "@/utils/cx";

/*
 * Top-bar designs for /preview/header. Each one is built from the same working parts (nav, ⌘K search,
 * language, theme, Read, phone menu: components/site/header-parts.tsx) and only differs in layout and
 * finish, so the chosen one can become the app's header without behavioural changes.
 */

export type HeaderVariantId = "tray" | "classic" | "pill" | "search" | "midnight";

export interface HeaderVariant {
  id: HeaderVariantId;
  name: string;
  description: string;
  /** Classes for the fixed <header> frame (floating cards get an inset, full-bleed bars none). */
  frame: string;
  /** How far the bar slides up when it hides on scroll. */
  hide: number;
  Bar: (props: { ctx: HeaderCtx }) => ReactNode;
}

const FLOATING = "px-3 pt-3 md:px-6";

/** Untitled UI nav buttons with an active marker; `marker` draws it (underline, dot…). */
function NavLinks({ ctx, className, item, marker }: { ctx: HeaderCtx; className?: string; item?: string; marker?: (current: boolean) => ReactNode }) {
  return (
    <nav aria-label="Main" className={cx("hidden md:block", className)}>
      <ul className="flex items-center gap-0.5">
        {navFor(ctx.h, ctx.lang).map((n) => {
          const current = ctx.isCurrent(n.href);
          return (
            <li key={n.href} className="relative">
              <NavButton href={n.href} icon={n.icon} current={current} className={item}>
                {n.label}
                {n.href === "/library" && <DueBadge due={ctx.due} />}
              </NavButton>
              {marker?.(current)}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const Divider = ({ className }: { className?: string }) => <span aria-hidden="true" className={cx("mx-1 hidden h-6 w-px bg-border-secondary sm:block", className)} />;

/** 1 · The current design: floating glass card, nav in a segmented tray. */
function TrayBar({ ctx }: { ctx: HeaderCtx }) {
  return (
    <div
      className={cx(
        "mx-auto flex h-16 max-w-7xl items-center gap-3 rounded-2xl px-3 ring-1 backdrop-blur-xl transition-all duration-300 md:px-4",
        ctx.scrolled ? "bg-primary/80 shadow-lg ring-secondary_alt" : "bg-primary/40 ring-secondary_alt/60",
      )}
    >
      <HomeLink ctx={ctx} />
      <nav aria-label="Main" className="ml-2 hidden md:block lg:ml-6">
        <ul className="flex items-center gap-0.5 rounded-xl bg-secondary/70 p-1 ring-1 ring-secondary ring-inset">
          {navFor(ctx.h, ctx.lang).map((n) => (
            <li key={n.href}>
              <NavButton href={n.href} icon={n.icon} current={ctx.isCurrent(n.href)} className="rounded-lg aria-[current=page]:bg-primary aria-[current=page]:shadow-xs">
                {n.label}
                {n.href === "/library" && <DueBadge due={ctx.due} />}
              </NavButton>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        <SearchTrigger ctx={ctx} />
        <Preferences ctx={ctx} />
        <Divider />
        <ReadButton ctx={ctx} />
        <PhoneMenu ctx={ctx} />
      </div>
    </div>
  );
}

/** 2 · Classic: full-width bar with a hairline, nav with an underline on the current page (Untitled UI header navigation). */
function ClassicBar({ ctx }: { ctx: HeaderCtx }) {
  return (
    <div className={cx("border-b transition-colors duration-300", ctx.scrolled ? "border-secondary bg-primary/90 shadow-xs backdrop-blur-xl" : "border-secondary/60 bg-primary/70 backdrop-blur-md")}>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 md:gap-8 md:px-8">
        <HomeLink ctx={ctx} />
        <NavLinks
          ctx={ctx}
          marker={(current) => current && <span aria-hidden="true" className="absolute inset-x-2 -bottom-[19px] h-0.5 rounded-full bg-fg-brand-primary" />}
        />
        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger ctx={ctx} wideFrom="lg" className="w-64" />
          <Preferences ctx={ctx} />
          <Divider />
          <ReadButton ctx={ctx} />
          <PhoneMenu ctx={ctx} />
        </div>
      </div>
    </div>
  );
}

/** 3 · Pill: a compact, centred floating capsule; quiet text navigation, round actions. */
function PillBar({ ctx }: { ctx: HeaderCtx }) {
  return (
    <div
      className={cx(
        "mx-auto flex h-14 max-w-4xl items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3 ring-1 backdrop-blur-xl transition-all duration-300",
        ctx.scrolled ? "bg-primary/85 shadow-lg ring-secondary_alt" : "bg-primary/60 shadow-xs ring-secondary_alt/70",
      )}
    >
      <HomeLink ctx={ctx} markOnly className="rounded-full" />
      <NavLinks ctx={ctx} className="ml-2" item="rounded-full px-3 [&_svg]:hidden aria-[current=page]:bg-secondary" />
      <div className="ml-auto flex items-center gap-1">
        <SearchTrigger ctx={ctx} wideFrom="never" iconClassName="rounded-full" />
        <Preferences ctx={ctx} className="[&_button]:rounded-full" />
        <ReadButton ctx={ctx} className="rounded-full px-4" />
        <PhoneMenu ctx={ctx} />
      </div>
    </div>
  );
}

/** 4 · Search first: a utility strip above, and the ⌘K search as the centrepiece of the bar. */
function SearchBar({ ctx }: { ctx: HeaderCtx }) {
  return (
    <div className={cx("border-b transition-colors duration-300", ctx.scrolled ? "border-secondary bg-primary/90 shadow-xs backdrop-blur-xl" : "border-secondary/60 bg-primary/75 backdrop-blur-md")}>
      <div className="hidden border-b border-secondary/70 md:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-8">
          <NavLinks ctx={ctx} className="-ml-2" item="py-1 [&_span]:text-xs [&_svg]:size-4" />
          <Preferences ctx={ctx} className="gap-1 [&_button]:py-1" />
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:gap-8 md:px-8">
        <HomeLink ctx={ctx} />
        <Button
          size="md"
          color="secondary"
          iconLeading={SearchLg}
          onPress={openCommandPalette}
          aria-label={ctx.h.goToLabel}
          className="hidden h-11 max-w-2xl flex-1 justify-start rounded-xl md:inline-flex [&_[data-text]]:flex [&_[data-text]]:flex-1 [&_[data-text]]:items-center"
        >
          <span className="flex-1 truncate text-left font-normal text-placeholder">{ctx.h.goToLabel}</span>
          <Kbd icon={Command} label="Command K">
            K
          </Kbd>
        </Button>
        <div className="ml-auto flex items-center gap-1.5">
          <SearchTrigger ctx={ctx} wideFrom="never" iconClassName="md:hidden" />
          <ReadButton ctx={ctx} />
          <PhoneMenu ctx={ctx} />
        </div>
      </div>
    </div>
  );
}

/** 5 · Midnight: the brand's indigo night in both themes, gold for the current page and the main action. */
function MidnightBar({ ctx }: { ctx: HeaderCtx }) {
  return (
    // `dark-mode` scopes Untitled UI's dark tokens to the bar, so every control renders for a dark surface.
    <div className="dark-mode relative bg-brand-950/95 shadow-lg backdrop-blur-xl">
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-gold-400/70 to-transparent" />
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 md:gap-8 md:px-8">
        <HomeLink ctx={ctx} />
        <NavLinks
          ctx={ctx}
          item="aria-[current=page]:bg-transparent"
          marker={(current) => current && <span aria-hidden="true" className="absolute -bottom-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-gold-400 shadow-[0_0_8px] shadow-gold-400" />}
        />
        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger ctx={ctx} wideFrom="lg" className="w-60 bg-white/5" />
          <Preferences ctx={ctx} />
          <Divider className="bg-white/15" />
          <ReadButton ctx={ctx} className="bg-gold-400 text-brand-950 ring-gold-300 *:data-icon:text-brand-950 hover:bg-gold-300" />
          <PhoneMenu ctx={ctx} />
        </div>
      </div>
    </div>
  );
}

export const HEADER_VARIANTS: HeaderVariant[] = [
  { id: "tray", name: "Tray (current)", description: "Floating glass card; Surahs, Juzʾ and Library in a segmented tray.", frame: FLOATING, hide: 96, Bar: TrayBar },
  { id: "classic", name: "Classic", description: "Full-width bar with a hairline; the current page is underlined. Calm and conventional.", frame: "", hide: 80, Bar: ClassicBar },
  { id: "pill", name: "Pill", description: "A compact centred capsule: logo mark, quiet text links and round actions.", frame: FLOATING, hide: 80, Bar: PillBar },
  { id: "search", name: "Search first", description: "Utility strip on top; a wide ⌘K search field is the centrepiece.", frame: "", hide: 120, Bar: SearchBar },
  { id: "midnight", name: "Midnight", description: "Indigo night in light and dark themes, gold for the current page and the Read button.", frame: "", hide: 80, Bar: MidnightBar },
];

/** Which design the header shows: "tray" for everyone; /preview/header switches it (kept in this browser). */
export const headerVariantStore = createStore<{ id: HeaderVariantId }>({ id: "tray" }, "mishkah:header-preview");
export const useHeaderVariant = () => {
  const id = useStore(headerVariantStore, (s) => s.id, { id: "tray" as HeaderVariantId });
  return HEADER_VARIANTS.find((v) => v.id === id) ?? HEADER_VARIANTS[0];
};
