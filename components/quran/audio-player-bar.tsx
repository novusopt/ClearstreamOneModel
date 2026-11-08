"use client";

import { FastForward, Headphones02, PauseCircle, PlayCircle, Repeat04, SkipBack, SkipForward, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import {
  Button as AriaButton,
  Slider as AriaSlider,
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
} from "react-aria-components";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { getReciter } from "@/lib/audio";
import { player, usePlayer, useTick } from "@/lib/audio-engine";
import { setSettings, useSettings } from "@/lib/settings";
import { formatTime } from "@/lib/utils";
import { cx } from "@/utils/cx";

const RATES = [0.75, 1, 1.25, 1.5];
const REPEAT_LABEL = { off: "Repeat off", ayah: "Repeat ayah", surah: "Repeat surah" } as const;
const REPEAT_NEXT = { off: "ayah", ayah: "surah", surah: "off" } as const;

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden="true" className="flex h-4 items-end gap-0.5">
      {[0, 0.2, 0.4, 0.1].map((d, i) => (
        <span
          key={i}
          className={cx("w-0.5 origin-bottom rounded-full bg-brand-solid", playing ? "animate-equalizer" : "scale-y-25")}
          style={{ animationDelay: `${d}s`, height: "100%" }}
        />
      ))}
    </span>
  );
}

function Progress() {
  const time = useTick((s) => s.time);
  const duration = useTick((s) => s.duration);
  return (
    <div className="flex w-full items-center gap-3 text-xs text-tertiary tabular-nums">
      <span className="w-9 text-right">{formatTime(time)}</span>
      <AriaSlider
        aria-label="Seek"
        value={duration ? Math.min(time, duration) : 0}
        minValue={0}
        maxValue={duration || 1}
        step={0.1}
        onChange={(v) => player.seek(Array.isArray(v) ? v[0] : v)}
        className="flex-1"
      >
        <AriaSliderTrack className="group relative h-4 w-full cursor-pointer">
          {({ state }) => (
            <>
              <span className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-quaternary" />
              <span
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-solid"
                style={{ width: `${state.getThumbPercent(0) * 100}%` }}
              />
              <AriaSliderThumb className="top-1/2 size-3 rounded-full bg-white shadow-md ring-2 ring-brand outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2" />
            </>
          )}
        </AriaSliderTrack>
      </AriaSlider>
      <span className="w-9">{formatTime(duration)}</span>
    </div>
  );
}

export function AudioPlayerBar() {
  const surah = usePlayer((s) => s.surah);
  const surahName = usePlayer((s) => s.surahName);
  const status = usePlayer((s) => s.status);
  const ayah = usePlayer((s) => s.verses[s.index]?.n ?? 0);
  const total = usePlayer((s) => s.verses.length);
  const reciterId = useSettings((s) => s.reciter);
  const rate = useSettings((s) => s.playbackRate);
  const repeat = useSettings((s) => s.repeat);
  const playing = status === "playing" || status === "loading";
  const reciter = getReciter(reciterId);

  return (
    <AnimatePresence>
      {surah != null && (
        <motion.div
          role="region"
          aria-label="Audio player"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:px-6 md:pb-5"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-2 rounded-2xl bg-primary/85 p-3 shadow-xl ring-1 ring-secondary_alt backdrop-blur-xl md:flex-row md:items-center md:gap-5 md:px-5">
            <div className="flex min-w-0 items-center gap-3 md:w-60">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-fg-brand-primary">
                <Headphones02 className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/surah/${surah}#v-${ayah}`} className="flex items-center gap-2 truncate text-sm font-semibold text-primary hover:underline">
                  {surahName} <span className="text-tertiary tabular-nums">{surah}:{ayah}</span>
                  <Equalizer playing={status === "playing"} />
                </Link>
                <p className="truncate text-xs text-tertiary">
                  {reciter.name}
                  {reciter.wordSync ? " · word sync" : ""} · {ayah}/{total}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <ButtonUtility size="sm" color="tertiary" tooltip={REPEAT_LABEL[repeat]} icon={Repeat04} className={cx(repeat !== "off" && "text-brand-secondary")} onPress={() => setSettings({ repeat: REPEAT_NEXT[repeat] })} />
                <ButtonUtility size="sm" color="tertiary" tooltip="Previous ayah" icon={SkipBack} onPress={() => player.prev()} />
                <AriaButton
                  aria-label={playing ? "Pause" : "Play"}
                  onPress={() => player.toggle()}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-brand-solid text-white shadow-md outline-focus-ring transition hover:scale-105 hover:bg-brand-solid_hover focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
                >
                  {playing ? <PauseCircle className="size-6" /> : <PlayCircle className="size-6" />}
                </AriaButton>
                <ButtonUtility size="sm" color="tertiary" tooltip="Next ayah" icon={SkipForward} onPress={() => player.next()} />
                <AriaButton
                  aria-label={`Playback speed ${rate}x`}
                  onPress={() => player.setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1)}
                  className="flex h-8 min-w-12 cursor-pointer items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold text-tertiary tabular-nums outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
                >
                  <FastForward className="size-3.5" />
                  {rate}×
                </AriaButton>
              </div>
              <Progress />
            </div>

            <div className="absolute top-2 right-2 md:static">
              <ButtonUtility size="xs" color="tertiary" tooltip="Close player" icon={XClose} onPress={() => player.stop()} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
