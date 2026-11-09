"use client";

import { animate, m, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useUi } from "@/components/providers/ui-messages";
import { TOTAL_AYAT, TOTAL_SURAHS, TOTAL_WORDS } from "@/lib/constants";

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  // Rest on the real number (thumbnails, no-JS, reduced motion); count up once when scrolled into view.
  const [value, setValue] = useState(to);
  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const controls = animate(0, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("en-US")}
    </span>
  );
}

const STAT_VALUES = { surahs: TOTAL_SURAHS, ayat: TOTAL_AYAT, words: TOTAL_WORDS, translations: 10 } as const;

export function Stats() {
  const labels = useUi().m.stats;
  const STATS = (Object.keys(STAT_VALUES) as Array<keyof typeof STAT_VALUES>).map((k) => ({ value: STAT_VALUES[k], label: labels[k] }));
  return (
    <section className="border-y border-secondary bg-secondary/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 md:grid-cols-4 md:px-8">
        {STATS.map((s, i) => (
          <m.div
            key={s.label}
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <p className="text-display-sm font-display font-medium tracking-tight text-primary md:text-display-md">
              <Counter to={s.value} />
            </p>
            <p className="mt-1 text-sm font-medium text-tertiary">{s.label}</p>
          </m.div>
        ))}
      </div>
    </section>
  );
}
