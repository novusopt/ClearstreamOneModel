"use client";

import { Command, CursorClick02 } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import { Alert } from "@/components/application/alerts/alert";
import { Kbd } from "@/components/site/command-palette";
import { setSettings, useSettings } from "@/lib/settings";

/** Shown once, the first time someone opens a surah: one slim Untitled UI alert, so the text still starts high. */
export function ReaderTips() {
  const seen = useSettings((s) => s.seenTips);
  const dismiss = () => setSettings({ seenTips: true });
  return (
    <AnimatePresence>
      {!seen && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="mb-4 overflow-hidden"
        >
          <Alert
            color="gray"
            icon={CursorClick02}
            title="Hover a word for its meaning, tap it to hear it"
            description={
              <>
                Press Listen or <Kbd>Space</Kbd> to follow the recitation word by word, and <Kbd icon={Command} label="Command K">K</Kbd> to jump to any
                ayah, like 2:255.
              </>
            }
            onClose={dismiss}
            closeLabel="Dismiss tips"
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}
