"use client";

import { GraduationHat01, RefreshCw01, Repeat01, StopCircle } from "@untitledui/icons";
import { motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { player, usePlayer } from "@/lib/audio-engine";
import { dueReviews, useLibrary } from "@/lib/library";
import { setSettings, useSettings } from "@/lib/settings";
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
  const hideMode = useSettings((s) => s.hifzHide);
  const pauseAfter = useSettings((s) => s.pauseAfter);
  const due = useLibrary((s) => dueReviews(s).length);

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
      <div className="mt-5 flex flex-col gap-4 border-t border-secondary pt-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-secondary">Hide</span>
          <ButtonGroup
            size="sm"
            selectedKeys={[hideMode]}
            disallowEmptySelection
            onSelectionChange={(k) => setSettings({ hifzHide: [...k][0] as typeof hideMode })}
            aria-label="Which words to hide"
          >
            <ButtonGroupItem id="all">All words</ButtonGroupItem>
            <ButtonGroupItem id="alternate">Every other</ButtonGroupItem>
            <ButtonGroupItem id="half">Second half</ButtonGroupItem>
            <ButtonGroupItem id="first-letter">First letters</ButtonGroupItem>
          </ButtonGroup>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-secondary">Pause to repeat</span>
            <ButtonGroup
              size="sm"
              selectedKeys={[String(pauseAfter)]}
              disallowEmptySelection
              onSelectionChange={(k) => setSettings({ pauseAfter: Number([...k][0]) })}
              aria-label="Pause after each ayah"
            >
              <ButtonGroupItem id="0">Off</ButtonGroupItem>
              <ButtonGroupItem id="5">5s</ButtonGroupItem>
              <ButtonGroupItem id="-1">Ayah length</ButtonGroupItem>
            </ButtonGroup>
          </div>
          <Button size="sm" color={due > 0 ? "primary" : "secondary"} href="/review" iconLeading={RefreshCw01}>
            {due > 0 ? `Review ${due} due` : "Review"}
          </Button>
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
