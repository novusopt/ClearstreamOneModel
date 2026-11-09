"use client";

import { BookOpen01, PauseCircle, PlayCircle, Share07 } from "@untitledui/icons";
import { notify } from "@/components/application/notifications/notification";
import { Button } from "@/components/base/buttons/button";
import { player, usePlayer } from "@/lib/audio-engine";
import type { AudioVerse } from "@/lib/types";

interface AyahActionsProps {
  surah: number;
  surahName: string;
  /** This ayah's audio entry (number, global number, word timings). */
  audio: AudioVerse;
  title: string;
  contextHref: string;
  /** Localized button labels (English by default). */
  labels?: { listen: string; pause: string; context: string; share: string; linkCopied: string };
}

const EN_LABELS = { listen: "Listen", pause: "Pause", context: "Read in context", share: "Share", linkCopied: "Link copied" };

/** Interactive island on the (otherwise server-rendered) ayah page: listen, read in context, share. */
export function AyahActions({ surah, surahName, audio, title, contextHref, labels = EN_LABELS }: AyahActionsProps) {
  const playing = usePlayer((s) => s.surah === surah && s.verses.length === 1 && s.verses[0]?.n === audio.n && (s.status === "playing" || s.status === "loading" || s.status === "repeat"));

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    notify.success(labels.linkCopied, { description: title });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="md"
        iconLeading={playing ? PauseCircle : PlayCircle}
        onPress={() => (playing ? player.toggle() : player.play(surah, surahName, [audio], 0))}
      >
        {playing ? labels.pause : labels.listen}
      </Button>
      <Button size="md" color="secondary" iconLeading={BookOpen01} href={contextHref}>
        {labels.context}
      </Button>
      <Button size="md" color="tertiary" iconLeading={Share07} onPress={share}>
        {labels.share}
      </Button>
    </div>
  );
}
