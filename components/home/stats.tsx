"use client";

import { useUi } from "@/components/providers/ui-messages";
import { TOTAL_AYAT, TOTAL_SURAHS, TOTAL_WORDS } from "@/lib/constants";

const STAT_VALUES = { surahs: TOTAL_SURAHS, ayat: TOTAL_AYAT, words: TOTAL_WORDS, translations: 10 } as const;

/** The real figures, shown as they are (no count-up). */
export function Stats() {
  const labels = useUi().m.stats;
  const STATS = (Object.keys(STAT_VALUES) as Array<keyof typeof STAT_VALUES>).map((k) => ({ value: STAT_VALUES[k], label: labels[k] }));
  return (
    <section className="border-y border-secondary bg-secondary/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 md:grid-cols-4 md:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-display-sm font-display font-medium tracking-tight text-primary tabular-nums md:text-display-md">
              {s.value.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-sm font-medium text-tertiary">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
