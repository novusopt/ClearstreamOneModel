"use client";

import { BookOpen01, Headphones02, LayersThree01, Palette, Translate01, Type01 } from "@untitledui/icons";
import { AnimatePresence, m, useMotionTemplate, useScroll, useTransform } from "motion/react";
import { type FC, type ReactNode, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useUi } from "@/components/providers/ui-messages";
import { ReciterAvatar, ReciterStack } from "@/components/quran/reciter-avatar";
import { TajweedText } from "@/components/quran/tajweed-text";
import { RECITERS, TAJWEED_RULES } from "@/lib/constants";
import type { Verse } from "@/lib/types";
import { cx } from "@/utils/cx";

const SAMPLE_TRANSLATIONS = [
  { lang: "English", code: "en", text: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence." },
  { lang: "Français", code: "fr", text: "Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par lui-même." },
  { lang: "Bahasa", code: "id", text: "Allah, tidak ada tuhan selain Dia. Yang Mahahidup, yang terus menerus mengurus makhluk-Nya." },
  { lang: "Türkçe", code: "tr", text: "Allah, kendisinden başka hiçbir ilah olmayandır. Diridir, kayyumdur." },
  { lang: "Español", code: "es", text: "¡Alá! No hay más dios que Él, el Viviente, el Subsistente." },
];

function BentoCard({
  className,
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  className?: string;
  icon: FC<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-secondary bg-primary p-6 shadow-xs transition-shadow duration-300 hover:shadow-lg md:p-8",
        className,
      )}
    >
      <div className="relative flex items-center gap-2 text-sm font-semibold text-brand-secondary">
        <FeaturedIcon icon={Icon} color="brand" theme="light" size="sm" />
        {eyebrow}
      </div>
      <h3 className="relative mt-4 text-xl font-display font-medium tracking-tight text-primary md:text-display-xs">{title}</h3>
      <p className="relative mt-2 max-w-md text-md text-tertiary">{description}</p>
      <div className="relative mt-6 flex flex-1 items-end">{children}</div>
    </div>
  );
}

/** Āyat al-Kursī's opening, set large (still: the page keeps one scroll effect, the Al-Fatihah story). */
function DisplayArabic({ text }: { text: string }) {
  return (
    <p lang="ar" dir="rtl" className="w-full font-quran text-4xl text-primary sm:text-5xl md:text-6xl">
      {text}
    </p>
  );
}

function TajweedDemo({ verse }: { verse: Verse }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "center 0.5"] });
  const mono = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const filter = useMotionTemplate`grayscale(${mono})`;
  const words = verse.w.slice(0, 9);
  return (
    <div ref={ref} className="w-full space-y-5">
      <m.p lang="ar" dir="rtl" style={{ filter }} className="font-quran text-3xl leading-[2.2] text-primary md:text-4xl">
        {words.map((w, i) => (
          <span key={i}>
            <TajweedText value={w.j} />{" "}
          </span>
        ))}
      </m.p>
      <div className="flex flex-wrap gap-1.5">
        {TAJWEED_RULES.slice(0, 7).map((r) => (
          <Badge key={r.id} type="modern" size="sm" color="gray" className="gap-1.5">
            <span className={`tj-${r.classes[0]} size-2 rounded-full bg-current`} />
            {r.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function WordByWordDemo({ verse }: { verse: Verse }) {
  const words = verse.w.slice(0, 6);
  // Follows the visitor's hover and focus; no timer.
  const [active, setActive] = useState(0);
  return (
    <div dir="rtl" className="flex w-full flex-wrap justify-center gap-2">
      {words.map((w, i) => (
        <AriaButton
          key={i}
          onHoverStart={() => setActive(i)}
          onFocus={() => setActive(i)}
          onPress={() => setActive(i)}
          className="relative flex min-w-20 cursor-pointer flex-col items-center rounded-2xl px-3 py-2 outline-focus-ring focus-visible:outline-2"
        >
          {active === i && (
            <m.span layoutId="bento-wbw" className="absolute inset-0 rounded-2xl bg-brand-primary ring-1 ring-brand" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
          )}
          <span lang="ar" className={cx("relative font-quran text-3xl transition-colors", active === i ? "text-brand-primary" : "text-primary")}>
            {w.a}
          </span>
          <span dir="ltr" className="relative mt-1 text-xs text-brand-tertiary italic">
            {w.t}
          </span>
          <span dir="ltr" className="relative text-xs text-tertiary">
            {w.e}
          </span>
        </AriaButton>
      ))}
    </div>
  );
}

function AudioDemo() {
  const bars = 36;
  return (
    <div className="w-full">
      <div className="flex h-24 items-center justify-between gap-1" aria-hidden="true">
        {Array.from({ length: bars }).map((_, i) => (
          <m.span
            key={i}
            className="h-full w-full rounded-full bg-gradient-to-t from-brand-600 to-brand-300"
            initial={{ scaleY: 0.15 }}
            whileInView={{ scaleY: [0.15, (30 + ((i * 37) % 70)) / 100, (25 + ((i * 53) % 75)) / 100] }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-tertiary">
        <span className="flex items-center gap-2 font-semibold text-secondary">
          <ReciterAvatar reciter={RECITERS[0]} size="xs" />
          Al-Husary
        </span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-quaternary">
          <m.span
            className="block h-full origin-left rounded-full bg-brand-solid"
            // From a sliver, not 0: an element with no area never counts as in view.
            initial={{ scaleX: 0.02 }}
            whileInView={{ scaleX: 0.62 }}
            viewport={{ once: true }}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
        <span className="flex items-center gap-2">
          <ReciterStack reciters={RECITERS} size="xs" />
          {useUi().m.bento.reciters}
        </span>
      </div>
    </div>
  );
}

function TranslationDemo() {
  // The visitor picks the language; nothing rotates on a timer.
  const [lang, setLang] = useState(SAMPLE_TRANSLATIONS[0].lang);
  const item = SAMPLE_TRANSLATIONS.find((x) => x.lang === lang) ?? SAMPLE_TRANSLATIONS[0];
  return (
    <div className="w-full space-y-3">
      <ButtonGroup
        size="sm"
        selectedKeys={[lang]}
        disallowEmptySelection
        onSelectionChange={(k) => setLang(String([...k][0]))}
        aria-label="Translation language"
        className="max-w-full overflow-x-auto"
      >
        {SAMPLE_TRANSLATIONS.map((x) => (
          <ButtonGroupItem key={x.lang} id={x.lang}>
            {x.lang}
          </ButtonGroupItem>
        ))}
      </ButtonGroup>
      <div className="relative min-h-28 w-full overflow-hidden rounded-2xl bg-secondary p-4 ring-1 ring-secondary">
        <AnimatePresence mode="wait" initial={false}>
          <m.p
            key={item.lang}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            lang={item.code}
            className="text-sm text-secondary"
          >
            {item.text}
          </m.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ModesDemo() {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {useUi().m.bento.modes.map((label, i) => (
        <div key={label} className="rounded-2xl bg-secondary p-3 ring-1 ring-secondary">
          <div className="space-y-1.5">
            {Array.from({ length: i ? 5 : 3 }).map((_, j) => (
              <span key={j} className={cx("block h-1.5 rounded-full bg-quaternary", i ? "w-full" : j === 2 ? "w-1/2" : "w-full")} />
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-tertiary">{label}</p>
        </div>
      ))}
    </div>
  );
}

export function BentoFeatures({ sample }: { sample: Verse }) {
  const t = useUi().m.bento;
  return (
    <section id="features" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <m.div
          initial={{ y: 24 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold text-brand-secondary">{t.eyebrow}</p>
          <h2 className="mt-3 text-display-sm font-display font-medium tracking-tight text-primary md:text-display-md">{t.title}</h2>
          <p className="mt-4 text-lg text-tertiary">{t.intro}</p>
        </m.div>

        <div className="mt-16 grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
          <BentoCard
            className="md:col-span-4"
            icon={Type01}
            eyebrow={t.cards[0].eyebrow}
            title={t.cards[0].title}
            description={t.cards[0].description}
          >
            <DisplayArabic text="ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ" />
          </BentoCard>
          <BentoCard
            className="md:col-span-2 md:row-span-2"
            icon={Palette}
            eyebrow={t.cards[1].eyebrow}
            title={t.cards[1].title}
            description={t.cards[1].description}
          >
            <TajweedDemo verse={sample} />
          </BentoCard>
          <BentoCard
            className="md:col-span-4"
            icon={LayersThree01}
            eyebrow={t.cards[2].eyebrow}
            title={t.cards[2].title}
            description={t.cards[2].description}
          >
            <WordByWordDemo verse={sample} />
          </BentoCard>
          <BentoCard
            className="md:col-span-3"
            icon={Headphones02}
            eyebrow={t.cards[3].eyebrow}
            title={t.cards[3].title}
            description={t.cards[3].description}
          >
            <AudioDemo />
          </BentoCard>
          <BentoCard
            className="md:col-span-3"
            icon={Translate01}
            eyebrow={t.cards[4].eyebrow}
            title={t.cards[4].title}
            description={t.cards[4].description}
          >
            <TranslationDemo />
          </BentoCard>
          <BentoCard
            className="md:col-span-3"
            icon={BookOpen01}
            eyebrow={t.cards[5].eyebrow}
            title={t.cards[5].title}
            description={t.cards[5].description}
          >
            <ModesDemo />
          </BentoCard>
          <BentoCard
            className="md:col-span-3"
            icon={LayersThree01}
            eyebrow={t.cards[6].eyebrow}
            title={t.cards[6].title}
            description={t.cards[6].description}
          >
            <div className="flex w-full items-center gap-3 rounded-2xl bg-secondary p-4 ring-1 ring-secondary">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-solid text-white">
                <BookOpen01 className="size-5" />
              </span>
              <div className="text-sm">
                <p className="font-semibold text-primary">Al-Kahf · 18:10</p>
                <p className="text-tertiary">{t.continueReading}</p>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
