"use client";

import { BookOpen01, Bookmark, Grid01, LayersThree01, Menu02, Stars02 } from "@untitledui/icons";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { useLibrary } from "@/lib/library";
import { cx } from "@/utils/cx";

const NAV = [
  { href: "/#surahs", label: "Surahs", icon: Grid01 },
  { href: "/#juz", label: "Juzʾ", icon: LayersThree01 },
  { href: "/#features", label: "Features", icon: Stars02 },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

function MobileMenu() {
  return (
    <SlideoutMenu.Trigger>
      <ButtonUtility size="sm" color="tertiary" tooltip="Open menu" tooltipPlacement="bottom" icon={Menu02} className="md:hidden" />
      <SlideoutMenu isDismissable className="z-50">
        {({ close }) => (
          <>
            <SlideoutMenu.Header onClose={close}>
              <Logo />
            </SlideoutMenu.Header>
            <SlideoutMenu.Content>
              <nav aria-label="Mobile">
                <ul className="flex flex-col gap-1">
                  {NAV.map((n) => (
                    <li key={n.href}>
                      <NavItemBase type="link" href={n.href} icon={n.icon} onClick={close}>
                        {n.label}
                      </NavItemBase>
                    </li>
                  ))}
                </ul>
              </nav>
            </SlideoutMenu.Content>
          </>
        )}
      </SlideoutMenu>
    </SlideoutMenu.Trigger>
  );
}

export function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastRead = useLibrary((s) => s.lastRead);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    setHidden(y > 320 && y > prev + 4);
    if (y < prev - 4) setHidden(false);
  });

  return (
    <motion.header
      animate={{ y: hidden ? -96 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-6"
    >
      <div
        className={cx(
          "mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-300 md:px-5",
          scrolled ? "bg-primary/75 shadow-lg ring-1 ring-secondary_alt backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <Link href="/" className="rounded-lg outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="Mishkah home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Button key={n.href} href={n.href} size="sm" color="tertiary">
              {n.label}
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <MobileMenu />
          <Button size="sm" href={lastRead ? `/surah/${lastRead.surah}#v-${lastRead.ayah}` : "/surah/1"} iconLeading={BookOpen01}>
            <span className="hidden sm:inline">{lastRead ? "Continue" : "Start reading"}</span>
            <span className="sm:hidden">Read</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
