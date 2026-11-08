"use client";

import { animate, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { TOTAL_AYAT, TOTAL_SURAHS, TOTAL_WORDS } from "@/lib/constants";

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("en-US")}
    </span>
  );
}

const STATS = [
  { value: TOTAL_SURAHS, label: "Surahs" },
  { value: TOTAL_AYAT, label: "Ayat" },
  { value: TOTAL_WORDS, label: "Words with meanings" },
  { value: 10, label: "Translations" },
];

export function Stats() {
  return (
    <section className="border-y border-secondary bg-secondary/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 md:grid-cols-4 md:px-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <p className="text-display-sm font-display font-medium tracking-tight text-primary md:text-display-md">
              <Counter to={s.value} />
            </p>
            <p className="mt-1 text-sm font-medium text-tertiary">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
