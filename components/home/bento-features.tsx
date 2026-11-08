"use client";

import { BookOpen01, Headphones02, LayersThree01, Palette, Translate01, Type01 } from "@untitledui/icons";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useScroll, useTransform } from "motion/react";
import { type FC, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { TajweedText } from "@/components/quran/tajweed-text";
import { TAJWEED_RULES } from "@/lib/constants";
import type { Verse } from "@/lib/types";
import { cx } from "@/utils/cx";

const SAMPLE_TRANSLATIONS = [
  { lang: "English", text: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence." },
  { lang: "Français", text: "Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par lui-même." },
  { lang: "Bahasa", text: "Allah, tidak ada tuhan selain Dia. Yang Mahahidup, yang terus menerus mengurus makhluk-Nya." },
  { lang: "Türkçe", text: "Allah, kendisinden başka hiçbir ilah olmayandır. Diridir, kayyumdur." },
  { lang: "Español", text: "¡Alá! No hay más dios que Él, el Viviente, el Subsistente." },
];

function BentoCard({
  className,
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  index,
}: {
  className?: string;
  icon: FC<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  index: number;
}) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, color-mix(in srgb, var(--color-brand-500) 14%, transparent), transparent 70%)`;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(-400);
        my.set(-400);
      }}
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-secondary bg-primary p-6 shadow-xs transition-shadow duration-300 hover:shadow-xl md:p-8",
        className,
      )}
    >
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: spotlight }} />
      <div className="relative flex items-center gap-2 text-sm font-semibold text-brand-secondary">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary">
          <Icon className="size-4" />
        </span>
        {eyebrow}
      </div>
      <h3 className="relative mt-4 text-xl font-display font-medium tracking-tight text-primary md:text-display-xs">{title}</h3>
      <p className="relative mt-2 max-w-md text-md text-tertiary">{description}</p>
      <div className="relative mt-6 flex flex-1 items-end">{children}</div>
    </motion.div>
  );
}

/** Arabic text that "writes itself" as the card scrolls through the viewport. */
function ScrollRevealArabic({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.35"] });
  const clip = useTransform(scrollYProgress, [0, 1], ["inset(0 0 0 100%)", "inset(0 0 0 0%)"]);
  return (
    <div ref={ref} className="relative w-full">
      <p lang="ar" dir="rtl" className="font-quran text-4xl text-quaternary/40 sm:text-5xl md:text-6xl" aria-hidden="true">
        {text}
      </p>
      <motion.p lang="ar" dir="rtl" style={{ clipPath: clip }} className="absolute inset-0 font-quran text-4xl text-primary sm:text-5xl md:text-6xl">
        {text}
      </motion.p>
    </div>
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
      <motion.p lang="ar" dir="rtl" style={{ filter }} className="font-quran text-3xl leading-[2.2] text-primary md:text-4xl">
        {words.map((w, i) => (
          <span key={i}>
            <TajweedText value={w.j} />{" "}
          </span>
        ))}
      </motion.p>
      <div className="flex flex-wrap gap-1.5">
        {TAJWEED_RULES.slice(0, 7).map((r) => (
          <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary ring-1 ring-secondary">
            <span className={`tj-${r.classes[0]} size-2 rounded-full bg-current`} />
            {r.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function WordByWordDemo({ verse }: { verse: Verse }) {
  const words = verse.w.slice(0, 6);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % words.length), 1400);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <div dir="rtl" className="flex w-full flex-wrap justify-center gap-2">
      {words.map((w, i) => (
        <button
          type="button"
          key={i}
          onMouseEnter={() => setActive(i)}
          onFocus={() => setActive(i)}
          className="relative flex min-w-20 flex-col items-center rounded-2xl px-3 py-2 outline-focus-ring focus-visible:outline-2"
        >
          {active === i && (
            <motion.span layoutId="bento-wbw" className="absolute inset-0 rounded-2xl bg-brand-primary ring-1 ring-brand" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
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
        </button>
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
          <motion.span
            key={i}
            className="w-full rounded-full bg-gradient-to-t from-brand-600 to-brand-300"
            initial={{ height: "15%" }}
            whileInView={{ height: ["15%", `${30 + ((i * 37) % 70)}%`, "20%", `${25 + ((i * 53) % 75)}%`, "15%"] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-tertiary">
        <span className="font-semibold text-secondary">Al-Husary</span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-quaternary">
          <motion.span
            className="block h-full rounded-full bg-brand-solid"
            initial={{ width: "0%" }}
            whileInView={{ width: "100%" }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </span>
        <span>5 reciters</span>
      </div>
    </div>
  );
}

function TranslationDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SAMPLE_TRANSLATIONS.length), 2800);
    return () => clearInterval(t);
  }, []);
  const item = SAMPLE_TRANSLATIONS[i];
  return (
    <div className="relative min-h-36 w-full overflow-hidden rounded-2xl bg-secondary p-4 ring-1 ring-secondary">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.lang}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
          transition={{ duration: 0.45 }}
        >
          <span className="text-xs font-semibold text-brand-secondary">{item.lang}</span>
          <p className="mt-1 text-sm text-secondary">{item.text}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ModesDemo() {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {["Verse by verse", "Mushaf reading"].map((label, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.15 }}
          className="rounded-2xl bg-secondary p-3 ring-1 ring-secondary"
        >
          <div className="space-y-1.5">
            {Array.from({ length: i ? 5 : 3 }).map((_, j) => (
              <span key={j} className={cx("block h-1.5 rounded-full bg-quaternary", i ? "w-full" : j === 2 ? "w-1/2" : "w-full")} />
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-tertiary">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function BentoFeatures({ sample }: { sample: Verse }) {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold text-brand-secondary">Everything in one reader</p>
          <h2 className="mt-3 text-display-sm font-display font-medium tracking-tight text-primary md:text-display-md">Built for reciting, reflecting & learning</h2>
          <p className="mt-4 text-lg text-tertiary">Each layer can be switched on or off, so the page stays as quiet or as rich as you need.</p>
        </motion.div>

        <div className="mt-16 grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
          <BentoCard
            index={0}
            className="md:col-span-4"
            icon={Type01}
            eyebrow="Qurʾānic text"
            title="Uthmani script, beautifully set"
            description="The full mushaf text in the Uthmani rasm with a Qurʾān-specific typeface, adjustable sizing and ornamented ayah markers."
          >
            <ScrollRevealArabic text="ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ" />
          </BentoCard>
          <BentoCard
            index={1}
            className="md:col-span-2 md:row-span-2"
            icon={Palette}
            eyebrow="Tajweed"
            title="Rules you can see"
            description="Nineteen recitation rules colour-coded letter by letter. Scroll to bring them to life."
          >
            <TajweedDemo verse={sample} />
          </BentoCard>
          <BentoCard
            index={2}
            className="md:col-span-4"
            icon={LayersThree01}
            eyebrow="Word by word"
            title="Meaning beneath every word"
            description="Hover or tap any word for its transliteration and meaning, hear it pronounced, or show glosses inline."
          >
            <WordByWordDemo verse={sample} />
          </BentoCard>
          <BentoCard
            index={3}
            className="md:col-span-3"
            icon={Headphones02}
            eyebrow="Audio"
            title="Recitation that follows along"
            description="Continuous playback with word-level highlighting, auto-scroll, repeat and speed control."
          >
            <AudioDemo />
          </BentoCard>
          <BentoCard
            index={4}
            className="md:col-span-3"
            icon={Translate01}
            eyebrow="Translation"
            title="Ten languages"
            description="Saheeh International plus nine more translations, loaded on demand."
          >
            <TranslationDemo />
          </BentoCard>
          <BentoCard
            index={5}
            className="md:col-span-3"
            icon={BookOpen01}
            eyebrow="Reading modes"
            title="Study or simply read"
            description="Switch between detailed verse cards and a continuous mushaf-style page."
          >
            <ModesDemo />
          </BentoCard>
          <BentoCard
            index={6}
            className="md:col-span-3"
            icon={LayersThree01}
            eyebrow="Your progress"
            title="Pick up where you left off"
            description="Your last ayah and bookmarks are remembered on this device — no account needed."
          >
            <div className="flex w-full items-center gap-3 rounded-2xl bg-secondary p-4 ring-1 ring-secondary">
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
                className="flex size-10 items-center justify-center rounded-full bg-brand-solid text-white"
              >
                <BookOpen01 className="size-5" />
              </motion.span>
              <div className="text-sm">
                <p className="font-semibold text-primary">Al-Kahf · 18:10</p>
                <p className="text-tertiary">Continue reading</p>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
