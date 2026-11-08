"use client";

import { BookOpen01 } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { libraryStore } from "@/lib/library";

const noop = () => () => {};

function ago(at: number): string {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** "Continue from ayah N" when re-opening a surah you were part-way through. */
export function ResumeBanner({ surah, total, onResume }: { surah: number; total: number; onResume: (ayah: number) => void }) {
  // Snapshot the position on arrival (it keeps changing while you read). Client-only, after hydration.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [entry] = useState(() => (typeof window === "undefined" ? null : libraryStore.get().lastRead));
  const [dismissed, setDismissed] = useState(false);
  const show =
    mounted && !dismissed && entry != null && entry.surah === surah && entry.ayah > 2 && entry.ayah < total && !window.location.hash;

  return (
    <AnimatePresence>
      {show && entry && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="overflow-hidden"
        >
          <div role="status" className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand bg-brand-primary/50 p-4 sm:flex-row sm:items-center">
            <FeaturedIcon icon={BookOpen01} color="brand" theme="light" size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">Continue where you left off?</p>
              <p className="text-sm text-tertiary">
                You were at ayah {entry.ayah} of {total}, {ago(entry.at)}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onPress={() => {
                  setDismissed(true);
                  onResume(entry.ayah);
                }}
              >
                Continue from {entry.ayah}
              </Button>
              <CloseButton size="sm" label="Start from the beginning" onClick={() => setDismissed(true)} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
