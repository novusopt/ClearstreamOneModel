"use client";

import { Command, CursorClick02, Headphones02, SearchLg } from "@untitledui/icons";
import { AnimatePresence, m } from "motion/react";
import type { FC } from "react";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Kbd } from "@/components/site/command-palette";
import { setSettings, useSettings } from "@/lib/settings";

const TIPS: Array<{ icon: FC<{ className?: string }>; title: string; body: React.ReactNode }> = [
  { icon: CursorClick02, title: "Every word is alive", body: "Hover or focus a word for its meaning and transliteration. Tap it to hear it pronounced." },
  { icon: Headphones02, title: "Listen and follow", body: <>Press Listen, or <Kbd>Space</Kbd>. The reciter’s current word lights up as you go.</> },
  { icon: SearchLg, title: "Go anywhere", body: <>Press <Kbd icon={Command} label="Command K">K</Kbd> to jump to an ayah like 2:255 or search words such as “mercy”.</> },
];

/** Shown once, the first time someone opens a surah. */
export function ReaderTips() {
  const seen = useSettings((s) => s.seenTips);
  return (
    <AnimatePresence>
      {!seen && (
        <m.section
          aria-label="How to use the reader"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="mb-6 overflow-hidden rounded-2xl border border-secondary bg-primary p-5 shadow-xs"
        >
          <div className="grid gap-5 md:grid-cols-3">
            {TIPS.map((t) => (
              <div key={t.title} className="flex gap-3">
                <FeaturedIcon icon={t.icon} color="gray" theme="modern" size="md" />
                <div>
                  <p className="text-sm font-semibold text-primary">{t.title}</p>
                  <p className="mt-0.5 text-sm text-tertiary">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" color="secondary" onPress={() => setSettings({ seenTips: true })}>
              Got it
            </Button>
          </div>
        </m.section>
      )}
    </AnimatePresence>
  );
}
