"use client";

import { m, type MotionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { TajweedText } from "@/components/quran/tajweed-text";
import { AyahMarker } from "@/components/quran/ayah-marker";
import type { Verse } from "@/lib/types";
import { useUi } from "@/components/providers/ui-messages";
import { cx } from "@/utils/cx";

function StoryVerse({ verse, i, total, progress }: { verse: Verse; i: number; total: number; progress: MotionValue<number> }) {
  const start = i / total;
  const end = (i + 1) / total;
  // Keyframe offsets must be strictly increasing and within [0, 1] for accelerated scroll animations.
  const a = Math.max(0, start - 0.06);
  const b = Math.max(a + 0.001, start);
  const d = Math.min(1, end + 0.08);
  const c = Math.min(d - 0.001, end);
  const opacity = useTransform(progress, [a, b, c, d], [0.18, 1, 1, i === total - 1 ? 1 : 0.35]);
  const scale = useTransform(progress, [a, b, c], [0.97, 1, 1]);
  return (
    <m.span style={{ opacity, scale }} className="inline-block origin-center">
      {verse.w.map((w, j) => (
        <span key={j}>
          <TajweedText value={w.j} />{" "}
        </span>
      ))}
      <AyahMarker n={verse.n} />
    </m.span>
  );
}

/** Sticky, scroll-driven walk through Al-Fātiḥah: each ayah lights up in turn. */
export function FatihahStory({ verses }: { verses: Verse[] }) {
  const { m: msg, fatihah: fatihahT } = useUi();
  const t = msg.story;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setActive(Math.min(verses.length - 1, Math.max(0, Math.floor(p * verses.length)))));
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} aria-label={t.label} className="relative h-[420vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden px-4">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-brand-primary/50 to-transparent" />
        <p className="text-sm font-semibold text-brand-secondary">{t.eyebrow}</p>
        <p lang="ar" dir="rtl" className="mt-8 max-w-5xl text-center font-quran text-2xl leading-[2.2] text-primary sm:text-3xl lg:text-4xl">
          {verses.map((v, i) => (
            <StoryVerse key={v.n} verse={v} i={i} total={verses.length} progress={scrollYProgress} />
          ))}
        </p>
        <div className="mt-10 h-24 w-full max-w-2xl text-center">
          <m.p
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-lg text-secondary md:text-xl"
          >
            <span className="mr-2 font-semibold text-brand-secondary tabular-nums">1:{verses[active].n}</span>
            {fatihahT?.[active] ?? verses[active].en}
          </m.p>
        </div>
        <div className="mt-6 flex items-center gap-2" aria-hidden="true">
          {verses.map((v, i) => (
            <span key={v.n} className={cx("h-1.5 rounded-full transition-all duration-300", i === active ? "w-8 bg-brand-solid" : "w-1.5 bg-quaternary")} />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-secondary">
          <m.div style={{ width: bar }} className="h-full bg-brand-solid" />
        </div>
      </div>
    </section>
  );
}
