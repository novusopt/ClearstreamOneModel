"use client";

import { FastForward, Microphone01, PauseCircle, PlayCircle, Repeat04, SkipBack, SkipForward, XClose } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Slider } from "@/components/base/slider/slider";
import { CountdownBar } from "@/components/quran/countdown-bar";
import { getReciter } from "@/lib/audio";
import { player, usePlayer, useTick } from "@/lib/audio-engine";
import { setSettings, useSettings } from "@/lib/settings";
import { formatTime } from "@/lib/utils";
import { cx } from "@/utils/cx";

const RATES = [0.75, 1, 1.25, 1.5];
const initials = (name: string) =>
  name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
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

/** Teaching pause: the listener's turn to recite, with a countdown to the next ayah. */
function YourTurn() {
  const pause = usePlayer((s) => s.pause);
  const ayah = usePlayer((s) => s.verses[s.index]?.n ?? 0);
  if (!pause) return null;
  const seconds = Math.max(1, Math.round((pause.until - pause.from) / 1000));
  return (
    <div className="flex w-full items-center gap-3 text-xs" role="status">
      <span className="flex shrink-0 items-center gap-1.5 font-semibold text-brand-secondary">
        <Microphone01 aria-hidden="true" className="size-4" />
        Your turn: recite ayah {ayah}
      </span>
      <div className="flex-1">
        <CountdownBar key={pause.from} seconds={seconds} className="h-1" progressClassName="bg-gold-500" />
      </div>
      <span className="w-9 text-tertiary tabular-nums">{seconds}s</span>
    </div>
  );
}

function Progress() {
  const time = useTick((s) => s.time);
  const duration = useTick((s) => s.duration);
  return (
    <div className="flex w-full items-center gap-3 text-xs text-tertiary tabular-nums">
      <span className="w-9 text-right">{formatTime(time)}</span>
      <div className="flex-1">
        <Slider
          aria-label="Seek"
          value={duration ? Math.min(time, duration) : 0}
          minValue={0}
          maxValue={duration || 1}
          step={0.1}
          onChange={(v) => player.seek(Array.isArray(v) ? v[0] : v)}
        />
      </div>
      <span className="w-9">{formatTime(duration)}</span>
    </div>
  );
}

export default function AudioPlayerBarContent() {
  const surah = usePlayer((s) => s.surah);
  const surahName = usePlayer((s) => s.surahName);
  const status = usePlayer((s) => s.status);
  const ayah = usePlayer((s) => s.verses[s.index]?.n ?? 0);
  const total = usePlayer((s) => s.verses.length);
  const reciterId = useSettings((s) => s.reciter);
  const rate = useSettings((s) => s.playbackRate);
  const repeat = useSettings((s) => s.repeat);
  const playing = status === "playing" || status === "loading" || status === "repeat";
  const reciter = getReciter(reciterId);

  return (
    <AnimatePresence>
      {surah != null && (
        <m.div
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
              <Avatar size="md" initials={initials(reciter.name)} alt={reciter.name} />
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
                <Button
                  aria-label={playing ? "Pause" : "Play"}
                  size="lg"
                  color="primary"
                  iconLeading={playing ? PauseCircle : PlayCircle}
                  onPress={() => player.toggle()}
                  className="rounded-full"
                />
                <ButtonUtility size="sm" color="tertiary" tooltip="Next ayah" icon={SkipForward} onPress={() => player.next()} />
                <Button
                  aria-label={`Playback speed ${rate}x`}
                  size="xs"
                  color="tertiary"
                  iconLeading={FastForward}
                  onPress={() => player.setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1)}
                  className="tabular-nums"
                >
                  {rate}×
                </Button>
              </div>
              {status === "repeat" ? <YourTurn /> : <Progress />}
            </div>

            <div className="absolute top-2 right-2 md:static">
              <ButtonUtility size="xs" color="tertiary" tooltip="Close player" icon={XClose} onPress={() => player.stop()} />
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
