"use client";

import { ArrowRight, Copy07 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import type { SimilarRef } from "@/lib/types";
import { normalizeArabic } from "@/lib/utils";
import { cx } from "@/utils/cx";

const norm = (w: string) => normalizeArabic(w).replace(/[^ء-ي]/g, "");

/** Arabic text where words absent from `against` are highlighted: the spots huffaz mix up. */
export function DiffText({ text, against, className }: { text: string; against: string; className?: string }) {
  const base = new Set(against.split(/\s+/).map(norm));
  return (
    <p lang="ar" dir="rtl" className={cx("font-quran text-2xl leading-[2.1] text-primary", className)}>
      {text.split(/\s+/).map((w, i) => {
        const differs = norm(w) && !base.has(norm(w));
        return (
          <span key={i}>
            <span className={cx(differs && "rounded-md bg-gold-200/70 px-0.5 text-gold-700 decoration-gold-500 dark:bg-gold-500/25 dark:text-gold-200")}>{w}</span>{" "}
          </span>
        );
      })}
    </p>
  );
}

interface SimilarAyatProps {
  current: { s: number; a: number; name: string; text: string };
  items: SimilarRef[];
  onNavigate?: () => void;
}

/** Side-by-side comparison of an ayah with its look-alikes, differences highlighted in gold. */
export function SimilarAyat({ current, items, onNavigate }: SimilarAyatProps) {
  const others = items.map((x) => x.t).join(" ");
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-brand bg-brand-primary_alt p-4">
        <div className="mb-1 flex items-center gap-2">
          <Badge type="pill-color" color="brand" size="sm">
            This ayah
          </Badge>
          <span className="text-xs font-medium text-tertiary tabular-nums">
            {current.name} {current.s}:{current.a}
          </span>
        </div>
        <DiffText text={current.text} against={others} />
      </div>
      {items.map((x) => (
        <div key={`${x.s}:${x.a}`} className="rounded-2xl border border-secondary bg-primary p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Badge type="modern" color="gray" size="sm" className="tabular-nums">
                {x.s}:{x.a}
              </Badge>
              <span className="text-xs font-medium text-tertiary">{x.n}</span>
            </span>
            <Button size="sm" color="link-color" href={`/surah/${x.s}#v-${x.a}`} iconTrailing={ArrowRight} onPress={onNavigate}>
              Open
            </Button>
          </div>
          <DiffText text={x.t} against={current.text} />
        </div>
      ))}
      <p className="flex items-center gap-1.5 text-xs text-tertiary">
        <Copy07 aria-hidden="true" className="size-3.5" />
        Highlighted words differ between the ayat. Source: Quran Mutashabihat Data (CC0).
      </p>
    </div>
  );
}
