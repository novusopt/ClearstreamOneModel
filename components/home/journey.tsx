"use client";

import { BookOpen01, CheckCircle, GraduationHat01, Lightbulb02, Microphone01, RefreshCw01 } from "@untitledui/icons";
import { AnimatePresence, motion, useInView } from "motion/react";
import { type FC, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { CountdownBar } from "@/components/quran/countdown-bar";
import { TafsirBody, useTafsirText } from "@/components/quran/tafsir-section";
import { TajweedText } from "@/components/quran/tajweed-text";
import { Word } from "@/components/quran/word";
import type { Verse } from "@/lib/types";
import { cx } from "@/utils/cx";

interface Step {
  id: string;
  icon: FC<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}

const STEPS: Step[] = [
  {
    id: "read",
    icon: BookOpen01,
    eyebrow: "Read",
    title: "The Arabic leads, everything else stays quiet",
    description: "Uthmani script set in Amiri Quran, laid out on the 604 pages of the Madani mushaf, with tajweed in colour when you want it.",
    points: ["Verse cards or continuous mushaf pages", "Surah, ayah, page and juzʾ always in view", "Resume exactly where you stopped"],
  },
  {
    id: "understand",
    icon: Lightbulb02,
    eyebrow: "Understand",
    title: "Meaning under every word, explanation under every ayah",
    description: "Hover any word for its transliteration and meaning, read ten translations, and open a short, trusted tafsir in nine languages.",
    points: ["77,000+ words with meanings", "Al-Mukhtaṣar tafsir, collapsed until you ask", "Private notes on any ayah"],
  },
  {
    id: "memorise",
    icon: GraduationHat01,
    eyebrow: "Memorise",
    title: "Hide the words, keep the first letter, recite it back",
    description: "Four ways to hide an ayah, a reciter who pauses so you can repeat, and loops of any range of ayat.",
    points: ["All words, every other, second half or first letters", "“Your turn” pause after each ayah", "Look-alike ayat flagged before you mix them up"],
  },
  {
    id: "review",
    icon: RefreshCw01,
    eyebrow: "Review",
    title: "What you memorise comes back before you forget it",
    description: "Ayat you mark as memorised return at growing intervals. Recite, check, and grade yourself honestly in a few seconds each.",
    points: ["Spaced repetition: tomorrow, in 3 days, then longer", "Keys 1–4 to grade, Space to reveal", "A gentle nudge on the home page when reviews are due"],
  },
];

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-3xl border border-secondary bg-primary p-5 shadow-xl sm:p-7", className)}>{children}</div>;
}

function ReadPanel({ verse }: { verse: Verse }) {
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-2">
        <Badge type="pill-color" color="gray" size="sm">
          Al-Fātiḥah 1:{verse.n}
        </Badge>
        <Badge type="pill-color" color="gray" size="sm">
          Page 1 · Juzʾ 1
        </Badge>
      </div>
      <p dir="rtl" lang="ar" className="mt-6 text-center font-quran text-3xl leading-[2.2] text-primary sm:text-4xl">
        {verse.w.map((w, i) => (
          <span key={i}>
            <TajweedText value={w.j} />{" "}
          </span>
        ))}
        <span className="pt-1 font-quran">
          <AyahMarker n={verse.n} />
        </span>
      </p>
      <p className="mt-4 text-center text-md text-tertiary">{verse.en}</p>
    </Panel>
  );
}

function UnderstandPanel({ verse, load }: { verse: Verse; load: boolean }) {
  const { text, lang } = useTafsirText(1, verse.n, load);
  return (
    <Panel>
      <div dir="rtl" lang="ar" className="flex flex-wrap justify-center gap-x-4 gap-y-4">
        {verse.w.map((w, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="font-quran text-3xl leading-[1.9] text-primary">
              <TajweedText value={w.j} />
            </span>
            <span dir="ltr" className="font-display text-sm text-gold-700 italic dark:text-gold-300">
              {w.t}
            </span>
            <span dir="ltr" className="text-xs text-tertiary">
              {w.e}
            </span>
          </div>
        ))}
      </div>
      <TafsirBody text={text} lang={lang} className="mt-6 [&>p:last-child]:line-clamp-5" />
    </Panel>
  );
}

type HideMode = "all" | "alternate" | "half" | "first-letter";
const HIDE_MODES: Array<{ id: HideMode; label: string }> = [
  { id: "all", label: "All words" },
  { id: "alternate", label: "Every other" },
  { id: "half", label: "Second half" },
  { id: "first-letter", label: "First letters" },
];

function hiddenBy(mode: HideMode, i: number, count: number) {
  if (mode === "alternate") return i % 2 === 1;
  if (mode === "half") return i >= Math.ceil(count / 2);
  return true;
}

/** Restarts the "Your turn" countdown every few seconds while the demo is on screen. */
function useCycle(ms: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((x) => x + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return n;
}

function MemorisePanel({ verse }: { verse: Verse }) {
  const [mode, setMode] = useState<HideMode>("first-letter");
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const cycle = useCycle(6500);
  return (
    <Panel>
      <ButtonGroup
        size="sm"
        selectedKeys={[mode]}
        disallowEmptySelection
        onSelectionChange={(k) => {
          setMode([...k][0] as HideMode);
          setRevealed(new Set());
        }}
        aria-label="Hide"
        className="max-w-full overflow-x-auto"
      >
        {HIDE_MODES.map((m) => (
          <ButtonGroupItem key={m.id} id={m.id}>
            {m.label}
          </ButtonGroupItem>
        ))}
      </ButtonGroup>
      <div dir="rtl" lang="ar" className="mt-6 flex flex-wrap items-start justify-center gap-x-1 gap-y-3">
        {verse.w.map((w, i) => (
          <Word
            key={i}
            word={w}
            surah={1}
            ayah={verse.n}
            index={i}
            tajweed={false}
            wordByWord={false}
            wbwTransliteration={false}
            active={false}
            sizeClass="text-3xl sm:text-4xl"
            concealed={hiddenBy(mode, i, verse.w.length) && !revealed.has(i)}
            hint={mode === "first-letter"}
            onReveal={(n) => setRevealed((prev) => new Set(prev).add(n))}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-quaternary">Tap a hidden word to peek.</p>
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-secondary bg-secondary/60 p-3">
        <FeaturedIcon icon={Microphone01} color="brand" theme="light" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">Your turn: recite ayah {verse.n}</p>
          <CountdownBar key={cycle} seconds={6} className="mt-2 h-1" />
        </div>
      </div>
    </Panel>
  );
}

const GRADES: Array<{ id: string; label: string; days: number; color: "secondary-destructive" | "secondary" | "primary" }> = [
  { id: "again", label: "Again", days: 1, color: "secondary-destructive" },
  { id: "hard", label: "Hard", days: 2, color: "secondary" },
  { id: "good", label: "Good", days: 3, color: "primary" },
  { id: "easy", label: "Easy", days: 4, color: "secondary" },
];

const inDays = (d: number) => (d === 1 ? "Tomorrow" : `In ${d} days`);

function ReviewPanel({ verse }: { verse: Verse }) {
  const [graded, setGraded] = useState<(typeof GRADES)[number] | null>(null);
  const done = graded ? 3 : 2;
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-primary">Today’s review</span>
        <span className="flex items-center gap-1.5 text-sm text-tertiary tabular-nums">
          <RefreshCw01 aria-hidden="true" className="size-4" /> {done + 1} of 5
        </span>
      </div>
      <ProgressBarBase value={done} max={5} className="mt-3 h-1.5" progressClassName="duration-500" />
      <p className="mt-6 text-center text-sm font-medium text-tertiary">Check your recitation</p>
      <p dir="rtl" lang="ar" className="mt-2 text-center font-quran text-3xl leading-[2.2] text-primary">
        {verse.w.map((w) => w.a).join(" ")}{" "}
        <span className="pt-1 font-quran">
          <AyahMarker n={verse.n} />
        </span>
      </p>
      <div className="mt-6 border-t border-secondary pt-5">
        {graded ? (
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <p className="flex items-center gap-2 text-sm text-secondary" role="status">
              <CheckCircle aria-hidden="true" className="size-5 text-fg-success-secondary" />
              Graded “{graded.label}”. Next review: {inDays(graded.days).toLowerCase()}.
            </p>
            <Button size="sm" color="link-color" onPress={() => setGraded(null)}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g) => (
              <Button key={g.id} color={g.color} size="md" onPress={() => setGraded(g)} className="flex-col gap-0 py-2">
                {g.label}
                <span className="text-xs font-normal opacity-80">{inDays(g.days)}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function StepPanel({ index, verse, load }: { index: number; verse: Verse; load: boolean }) {
  if (index === 0) return <ReadPanel verse={verse} />;
  if (index === 1) return <UnderstandPanel verse={verse} load={load} />;
  if (index === 2) return <MemorisePanel verse={verse} />;
  return <ReviewPanel verse={verse} />;
}

function StepBlock({ step, index, active, onActive, verse, load }: { step: Step; index: number; active: boolean; onActive: (i: number) => void; verse: Verse; load: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div ref={ref} className="flex flex-col justify-center py-10 lg:min-h-[75vh] lg:py-0">
      <div className={cx("transition-opacity duration-500", active ? "lg:opacity-100" : "lg:opacity-40")}>
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-solid font-display text-sm text-white tabular-nums">{index + 1}</span>
          <span className="text-sm font-semibold text-brand-secondary">{step.eyebrow}</span>
        </div>
        <h3 className="mt-4 font-display text-display-xs font-medium tracking-tight text-primary md:text-display-sm">{step.title}</h3>
        <p className="mt-3 max-w-lg text-lg text-tertiary">{step.description}</p>
        <ul className="mt-5 space-y-2.5">
          {step.points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-md text-secondary">
              <CheckCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-brand-secondary" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      {/* Phones: the panel sits under its step. */}
      <div className="mt-8 lg:hidden">
        <StepPanel index={index} verse={verse} load={load} />
      </div>
    </div>
  );
}

/** Scroll-driven walkthrough: steps on the left, a sticky live panel on the right that follows them. */
export function Journey({ verse }: { verse: Verse }) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, { once: true, margin: "400px 0px" });
  const Icon = STEPS[active].icon;

  return (
    <section ref={ref} id="journey" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-brand-secondary">One ayah at a time</p>
          <h2 className="mt-3 font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md">
            From first reading to firm memory
          </h2>
          <p className="mt-4 text-lg text-tertiary">
            Mishkah follows the way people actually learn the Qurʾān: read it, understand it, carry it by heart, and keep it.
          </p>
        </div>

        <div className="mt-12 grid gap-x-16 lg:mt-4 lg:grid-cols-2">
          <div>
            {STEPS.map((s, i) => (
              <StepBlock key={s.id} step={s} index={i} active={active === i} onActive={setActive} verse={verse} load={near} />
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-[calc(50vh-15rem)]">
              <div className="mb-4 flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <span key={s.id} className={cx("h-1 flex-1 rounded-full transition-colors duration-500", i <= active ? "bg-brand-solid" : "bg-quaternary")} />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium text-tertiary">
                    <Icon aria-hidden="true" className="size-4 text-fg-brand-secondary" />
                    {STEPS[active].eyebrow}
                  </p>
                  <StepPanel index={active} verse={verse} load={near} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button size="lg" color="secondary" href="/surah/1" iconLeading={BookOpen01}>
            Start with Al-Fātiḥah
          </Button>
        </div>
      </div>
    </section>
  );
}
