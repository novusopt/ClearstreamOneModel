"use client";

import { BookOpen01 } from "@untitledui/icons";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { useLibrary } from "@/lib/library";
import { cx } from "@/utils/cx";

const NAV = [
  { href: "/#surahs", label: "Surahs" },
  { href: "/#juz", label: "Juzʾ" },
  { href: "/#features", label: "Features" },
  { href: "/bookmarks", label: "Bookmarks" },
];

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
        <Link href="/" className="rounded-lg outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="Noor home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-tertiary outline-focus-ring transition hover:bg-primary_hover hover:text-secondary focus-visible:outline-2"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            size="sm"
            href={lastRead ? `/surah/${lastRead.surah}#v-${lastRead.ayah}` : "/surah/1"}
            iconLeading={BookOpen01}
          >
            <span className="hidden sm:inline">{lastRead ? "Continue" : "Start reading"}</span>
            <span className="sm:hidden">Read</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
