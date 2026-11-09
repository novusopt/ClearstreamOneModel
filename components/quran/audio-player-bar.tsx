"use client";

import { lazy, Suspense, useState } from "react";
import { usePlayer } from "@/lib/audio-engine";

// The player (slider, controls, motion) downloads the first time something plays.
const AudioPlayerBarContent = lazy(() => import("@/components/quran/audio-player-bar-content"));

export function AudioPlayerBar() {
  const active = usePlayer((s) => s.surah != null);
  const [loaded, setLoaded] = useState(false);
  if (active && !loaded) setLoaded(true);
  if (!loaded) return null;
  return (
    <Suspense fallback={null}>
      <AudioPlayerBarContent />
    </Suspense>
  );
}
