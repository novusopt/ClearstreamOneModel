"use client";

import { ChevronDown, Microphone01, PauseCircle, PlayCircle, Repeat04, SkipBack, SkipForward, XClose } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Slider } from "@/components/base/slider/slider";
import { CountdownBar } from "@/components/quran/countdown-bar";
import { ReciterAvatar } from "@/components/quran/reciter-avatar";
import { getReciter } from "@/lib/audio";
import { player, usePlayer, useTick } from "@/lib/audio-engine";
import type { Reciter } from "@/lib/constants";
import { setSettings, useSettings } from "@/lib/settings";
import { formatTime } from "@/lib/utils";
import { cx } from "@/utils/cx";

const RATES = [0.75, 1, 1.25, 1.5];
const REPEAT_LABEL = { off: "Repeat off", ayah: "Repeat ayah", surah: "Repeat surah" } as const;
const REPEAT_NEXT = { off: "ayah", ayah: "surah", surah: "off" } as const;

/** The reciter, framed by a gold ring that turns while the recitation plays. */
function ReciterDisc({ reciter, playing }: { reciter: Reciter; playing: boolean }) {
  return (
    <span className="relative grid size-12 shrink-0 place-items-center">
      <span
        aria-hidden="true"
        className={cx(
          "absolute inset-0 animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,var(--color-gold-300),var(--color-brand-500),var(--color-gold-500),var(--color-brand-300),var(--color-gold-300))] transition-opacity duration-500",
          playing ? "opacity-100" : "opacity-40 [animation-play-state:paused]",
        )}
      />
      <span aria-hidden="true" className="absolute inset-[2px] rounded-full bg-primary" />
      <ReciterAvatar reciter={reciter} size="md" className="relative" />
    </span>
  );
}

/** The large play/pause control: icon morphs between states, a soft glow breathes while playing. */
function PlayButton({ playing, loading }: { playing: boolean; loading: boolean }) {
  return (
    <span className="relative grid place-items-center">
      <AnimatePresence>
        {playing && (
          <m.span
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute size-16 animate-flicker rounded-full bg-gold-400/30 blur-md dark:bg-gold-400/20"
          />
        )}
      </AnimatePresence>
      {loading && (
        <span aria-hidden="true" className="absolute size-[3.4rem] animate-spin rounded-full border-2 border-transparent border-t-gold-500 border-r-gold-500/40" />
      )}
      <Button
        aria-label={playing ? "Pause" : "Play"}
        size="xl"
        color="primary"
        onPress={() => player.toggle()}
        className="relative size-12 rounded-full p-0 shadow-lg before:rounded-full"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={playing ? "pause" : "play"}
            initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="grid place-items-center"
          >
            {playing ? <PauseCircle aria-hidden="true" className="size-7" /> : <PlayCircle aria-hidden="true" className="size-7" />}
          </m.span>
        </AnimatePresence>
      </Button>
    </span>
  );
}

/** The word being recited right now (word-synced reciter), crossfading as the recitation moves on. */
function NowReciting() {
  const index = usePlayer((s) => s.index);
  const words = usePlayer((s) => s.verses[s.index]?.a);
  const word = useTick((s) => s.word);
  const text = word >= 0 ? words?.[word] : undefined;
  return (
    <span aria-hidden="true" className="relative hidden h-11 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary/70 ring-1 ring-secondary ring-inset lg:flex">
      <span className="absolute top-1 left-2 text-[9px] font-semibold tracking-[0.08em] text-quaternary uppercase">Now</span>
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={text ? `${index}-${word}` : "idle"}
          lang="ar"
          dir="rtl"
          initial={{ y: 10, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -10, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.18 }}
          className="truncate px-3 pt-1 font-quran text-xl leading-none text-brand-secondary"
        >
          {text ?? "۞"}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

/** Animated level bars: decorative, they move only while audio is actually playing. */
function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden="true" className="flex h-3.5 items-end gap-[2px]">
      {[0, 0.25, 0.5, 0.15, 0.35].map((d, i) => (
        <span
          key={i}
          className={cx("w-[3px] origin-bottom rounded-full bg-gold-500", playing ? "animate-equalizer" : "scale-y-25")}
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

function SpeedMenu({ rate }: { rate: number }) {
  return (
    <Dropdown.Root>
      <Button size="xs" color="tertiary" aria-label={`Playback speed ${rate}×`} iconTrailing={ChevronDown} className="tabular-nums">
        {rate}×
      </Button>
      <Dropdown.Popover className="z-50 w-36" placement="top end">
        <Dropdown.Menu
          aria-label="Playback speed"
          selectionMode="single"
          selectedKeys={[String(rate)]}
          onAction={(k) => player.setRate(Number(k))}
        >
          {RATES.map((r) => (
            <Dropdown.Item key={r} id={String(r)} label={r === 1 ? "1× Normal" : `${r}×`} />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

function RepeatButton({ repeat }: { repeat: keyof typeof REPEAT_NEXT }) {
  return (
    <ButtonUtility
      size="sm"
      color="tertiary"
      tooltip={REPEAT_LABEL[repeat]}
      icon={Repeat04}
      className={cx(repeat !== "off" && "bg-brand-primary text-fg-brand-secondary")}
      onPress={() => setSettings({ repeat: REPEAT_NEXT[repeat] })}
    />
  );
}

export default function AudioPlayerBarContent() {
  const surah = usePlayer((s) => s.surah);
  const surahName = usePlayer((s) => s.surahName);
  const status = usePlayer((s) => s.status);
  const ayah = usePlayer((s) => s.verses[s.index]?.n ?? 0);
  const index = usePlayer((s) => s.index);
  const total = usePlayer((s) => s.verses.length);
  const reciterId = useSettings((s) => s.reciter);
  const rate = useSettings((s) => s.playbackRate);
  const repeat = useSettings((s) => s.repeat);
  const playing = status === "playing" || status === "loading" || status === "repeat";
  const reciter = getReciter(reciterId);
  const surahProgress = total ? (index + 1) / total : 0;

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
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-primary/85 shadow-2xl ring-1 ring-secondary_alt backdrop-blur-xl">
            {/* Lantern light behind the controls, and the surah progress along the top edge. */}
            <span aria-hidden="true" className="pointer-events-none absolute -top-16 left-1/2 size-56 -translate-x-1/2 rounded-full bg-gold-300/20 blur-3xl dark:bg-gold-500/10" />
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-secondary">
              <m.span
                className="block h-full origin-left bg-linear-to-r from-gold-400 via-gold-500 to-brand-500"
                animate={{ scaleX: surahProgress }}
                transition={{ type: "spring", stiffness: 120, damping: 24 }}
              />
            </span>

            <div className="relative flex flex-col gap-2 px-3 pt-3.5 pb-3 md:flex-row md:items-center md:gap-5 md:px-5">
              {/* Now playing */}
              <div className="flex min-w-0 items-center gap-3 md:w-72">
                <ReciterDisc reciter={reciter} playing={status === "playing"} />
                <div className="min-w-0 flex-1">
                  <Link href={`/surah/${surah}#v-${ayah}`} className="flex items-center gap-2 rounded-md outline-focus-ring focus-visible:outline-2">
                    <span className="truncate font-display text-md font-medium text-primary">{surahName}</span>
                    <span className="shrink-0 text-sm font-semibold text-brand-secondary tabular-nums">
                      {surah}:{ayah}
                    </span>
                    <Equalizer playing={status === "playing"} />
                  </Link>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-tertiary">
                    <span className="truncate">{reciter.name}</span>
                    {reciter.wordSync && (
                      <Badge type="pill-color" color="brand" size="sm" className="hidden shrink-0 sm:inline-flex">
                        Word sync
                      </Badge>
                    )}
                  </p>
                </div>
                {/* Phones: the essentials stay in the first row. */}
                <div className="flex items-center gap-1 md:hidden">
                  <ButtonUtility size="sm" color="tertiary" tooltip="Previous ayah" icon={SkipBack} onPress={() => player.prev()} className="max-[379px]:hidden" />
                  <PlayButton playing={playing} loading={status === "loading"} />
                  <ButtonUtility size="sm" color="tertiary" tooltip="Next ayah" icon={SkipForward} onPress={() => player.next()} className="max-[379px]:hidden" />
                </div>
              </div>

              {/* Transport and progress */}
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="hidden items-center gap-2 md:flex">
                  <RepeatButton repeat={repeat} />
                  <ButtonUtility size="sm" color="tertiary" tooltip="Previous ayah" icon={SkipBack} onPress={() => player.prev()} />
                  <PlayButton playing={playing} loading={status === "loading"} />
                  <ButtonUtility size="sm" color="tertiary" tooltip="Next ayah" icon={SkipForward} onPress={() => player.next()} />
                  <SpeedMenu rate={rate} />
                </div>
                <div className="flex w-full items-center gap-2">
                  <span className="md:hidden">
                    <RepeatButton repeat={repeat} />
                  </span>
                  {status === "repeat" ? <YourTurn /> : <Progress />}
                  <span className="flex items-center md:hidden">
                    <SpeedMenu rate={rate} />
                    <ButtonUtility size="xs" color="tertiary" tooltip="Close player" icon={XClose} onPress={() => player.stop()} />
                  </span>
                </div>
              </div>

              {/* Live word and ayah position */}
              <div className="hidden items-center gap-3 md:flex">
                {reciter.wordSync ? <NowReciting /> : null}
                <span className="hidden text-right text-xs leading-tight text-tertiary tabular-nums xl:block">
                  Ayah
                  <span className="block text-sm font-semibold text-primary">
                    {ayah}
                    <span className="font-normal text-tertiary">/{total}</span>
                  </span>
                </span>
              </div>

              <div className="hidden md:block">
                <ButtonUtility size="xs" color="tertiary" tooltip="Close player" icon={XClose} onPress={() => player.stop()} />
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
