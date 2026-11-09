"use client";

import { ArrowRight, BookOpen01 } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/base/buttons/button";
import { Alert } from "@/components/application/alerts/alert";
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
        <m.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="overflow-hidden"
        >
          <Alert
            color="brand"
            icon={BookOpen01}
            className="mb-6"
            title="Continue where you left off?"
            description={`You were at ayah ${entry.ayah} of ${total}, ${ago(entry.at)}.`}
            onClose={() => setDismissed(true)}
            closeLabel="Start from the beginning"
            actions={
              <>
                <Button size="sm" color="link-gray" onPress={() => setDismissed(true)}>
                  Start from the beginning
                </Button>
                <Button
                  size="sm"
                  color="link-color"
                  iconTrailing={ArrowRight}
                  onPress={() => {
                    setDismissed(true);
                    onResume(entry.ayah);
                  }}
                >
                  Continue from ayah {entry.ayah}
                </Button>
              </>
            }
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}
