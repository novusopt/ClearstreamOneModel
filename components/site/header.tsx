"use client";

import { BookOpen01, Bookmark, Command, Globe02, Grid01, LayersThree01, Menu02, SearchLg } from "@untitledui/icons";
import { m, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Kbd, openCommandPalette } from "@/components/site/command-palette";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { chromeStore } from "@/lib/chrome";
import { ALL_LANGUAGES, type Lang } from "@/lib/i18n";
import { useLibrary } from "@/lib/library";
import { langFromPath, localizeHref, switchLanguagePath } from "@/lib/locale-path";
import type { ChromeMessages } from "@/lib/ui-messages";
import { cx } from "@/utils/cx";

type HeaderStrings = ChromeMessages["header"];

const navFor = (h: HeaderStrings, lang: Lang) => [
  { href: localizeHref(lang, "/#surahs"), label: h.surahs, icon: Grid01 },
  { href: localizeHref(lang, "/#juz"), label: h.juz, icon: LayersThree01 },
  { href: "/library", label: h.library, icon: Bookmark },
];

/** Language switcher: opens the same page in another language where one exists, else that language's home. */
function LanguageMenu({ label, pathname }: { label: string; pathname: string }) {
  const current = langFromPath(pathname);
  return (
    <Dropdown.Root>
      <ButtonUtility size="sm" color="tertiary" tooltip={label} tooltipPlacement="bottom" icon={Globe02} aria-label={label} />
      <Dropdown.Popover className="w-48" placement="bottom end">
        <Dropdown.Menu aria-label={label} selectionMode="single" selectedKeys={[current]}>
          {ALL_LANGUAGES.map((l) => (
            <Dropdown.Item key={l.id} id={l.id} href={switchLanguagePath(pathname, l.id)} hrefLang={l.code} textValue={l.native} selectionIndicator="radio">
              <span lang={l.code} className="text-sm font-medium text-primary">
                {l.native}
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

function MobileMenu({ h, lang }: { h: HeaderStrings; lang: Lang }) {
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

  return (
    <m.header
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
        <Link href={localizeHref(lang, "/")} className="rounded-lg outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={h.home}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navFor(h, lang).map((n) => (
            <Button key={n.href} href={n.href} size="sm" color="tertiary">
              {n.label}
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Button size="sm" color="secondary" iconLeading={SearchLg} onPress={openCommandPalette} className="hidden lg:inline-flex" aria-label={h.goToLabel}>
            <span className="text-tertiary">{h.goTo}</span>
            <Kbd icon={Command} label="Command K">
              K
            </Kbd>
          </Button>
          <ButtonUtility size="sm" color="tertiary" tooltip={h.goToLabel} tooltipPlacement="bottom" icon={SearchLg} onPress={openCommandPalette} className="lg:hidden" />
          <LanguageMenu label={h.language} pathname={pathname} />
          <ThemeToggle />
          <MobileMenu h={h} lang={lang} />
          <Button size="sm" href={lastRead ? localizeHref(lang, `/surah/${lastRead.surah}#v-${lastRead.ayah}`) : lang === "en" ? "/surah/1" : `/surah/1?t=${lang}`} iconLeading={BookOpen01}>
            <span className="hidden sm:inline">{lastRead ? h.continue : h.start}</span>
            <span className="sm:hidden">{h.read}</span>
          </Button>
        </div>
      </div>
    </m.header>
  );
}
