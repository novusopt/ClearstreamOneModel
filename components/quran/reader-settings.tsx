"use client";

import { Settings04 } from "@untitledui/icons";
import { lazy, Suspense, useState } from "react";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button } from "@/components/base/buttons/button";
import { createStore, useStore } from "@/lib/create-store";

const panelStore = createStore({ open: false });
/** Open the settings panel from elsewhere (e.g. the Display menu on phones). */
export const openReaderSettings = () => panelStore.set({ open: true });

// Selects, toggles, sliders and the tajweed legend load the first time the panel opens.
const ReaderSettingsPanel = lazy(() => import("@/components/quran/reader-settings-panel"));

export function ReaderSettings({ className }: { className?: string }) {
  const open = useStore(panelStore, (p) => p.open, { open: false });
  const [loaded, setLoaded] = useState(false);
  if (open && !loaded) setLoaded(true);

  return (
    <SlideoutMenu.Trigger isOpen={open} onOpenChange={(o) => panelStore.set({ open: o })}>
      <Button size="sm" color="secondary" iconLeading={Settings04} aria-label="Reader settings" className={className}>
        <span className="hidden sm:inline">Settings</span>
      </Button>
      {loaded && (
        <Suspense fallback={null}>
          <ReaderSettingsPanel />
        </Suspense>
      )}
    </SlideoutMenu.Trigger>
  );
}
