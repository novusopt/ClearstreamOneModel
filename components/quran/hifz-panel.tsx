"use client";

import { GraduationHat01, Repeat01, StopCircle } from "@untitledui/icons";
import { motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { player, usePlayer } from "@/lib/audio-engine";
import { useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";

const TIMES = [1, 3, 5, 10];

/** Memorisation tools: progress for this surah and an ayah-range repeat loop. */
export function HifzPanel({ chapter, onRepeat }: { chapter: Chapter; onRepeat: (from: number, to: number, times: number) => void }) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState(String(Math.min(5, chapter.versesCount)));
  const [times, setTimes] = useState(3);
  const memorised = useLibrary((s) => s.memorised.filter((k) => k.startsWith(`${chapter.id}:`)).length);
  const range = usePlayer((s) => (s.surah === chapter.id ? s.range : null));
  const current = usePlayer((s) => (s.surah === chapter.id && s.range ? s.verses[s.index]?.n : null));

  const clamp = (v: string) => Math.min(chapter.versesCount, Math.max(1, Number(v) || 1));
  const pct = Math.round((memorised / chapter.versesCount) * 100);

  return (
    <motion.section
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      aria-label="Memorisation tools"
      className="mb-6 rounded-3xl border border-secondary bg-primary p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <FeaturedIcon icon={GraduationHat01} color="brand" theme="light" size="lg" />
          <div>
            <h2 className="font-display text-lg font-medium text-primary">Memorise {chapter.nameSimple}</h2>
            <p className="mt-0.5 text-sm text-tertiary">Words are hidden. Recite from memory, then tap to check.</p>
            <div className="mt-2 flex items-center gap-2">
              <ProgressBarBase value={pct} className="h-1.5 w-32" progressClassName="bg-fg-success-secondary" />
              <span className="text-xs text-tertiary tabular-nums">
                {memorised}/{chapter.versesCount} memorised
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Input label="From ayah" type="number" size="sm" value={from} onChange={setFrom} onBlur={() => setFrom(String(clamp(from)))} className="w-24" />
          <Input label="To ayah" type="number" size="sm" value={to} onChange={setTo} onBlur={() => setTo(String(clamp(to)))} className="w-24" />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-secondary">Repeat</span>
            <ButtonGroup size="sm" selectedKeys={[String(times)]} disallowEmptySelection onSelectionChange={(k) => setTimes(Number([...k][0]))} aria-label="Repetitions">
              {TIMES.map((t) => (
                <ButtonGroupItem key={t} id={String(t)}>
                  {t}×
                </ButtonGroupItem>
              ))}
            </ButtonGroup>
          </div>
          {range ? (
            <Button size="sm" color="secondary" iconLeading={StopCircle} onPress={() => (player.clearRange(), player.toggle())}>
              Stop loop
            </Button>
          ) : (
            <Button size="sm" iconLeading={Repeat01} onPress={() => onRepeat(clamp(from) - 1, clamp(to) - 1, times)}>
              Start loop
            </Button>
          )}
        </div>
      </div>
      {range && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-secondary">
          <Badge type="pill-color" color="brand" size="sm">
            Pass {range.pass} of {range.times}
          </Badge>
          <span className="text-tertiary">Now reciting ayah {current}</span>
        </div>
      )}
    </motion.section>
  );
}
