"use client";

import { CheckCircle, Download01, WifiOff } from "@untitledui/icons";
import { useState } from "react";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { notify } from "@/components/application/notifications/notification";
import { useTafsirLang } from "@/components/quran/tafsir-section";
import { TOTAL_SURAHS } from "@/lib/constants";
import { libraryStore, useLibrary } from "@/lib/library";
import { IS_ARTIFACT } from "@/lib/runtime";
import { useSettings } from "@/lib/settings";

/** Must match the cache names in public/sw.js. */
const PAGES = "mishkah-v1-pages";
const STATIC = "mishkah-v1-static";

/** Save every surah (page, data, translation, tafsir) into the offline caches. */
export function OfflineCard() {
  const offlineAt = useLibrary((s) => s.offlineAt);
  const lang = useSettings((s) => s.translation);
  const tafsirLang = useTafsirLang();
  const [progress, setProgress] = useState<number | null>(null);

  if (IS_ARTIFACT) return null;

  const save = async () => {
    if (!("caches" in window)) {
      notify.error("Offline reading isn't supported here", { description: "Your browser doesn't allow saving pages for offline use." });
      return;
    }
    setProgress(0);
    try {
      const [pages, data] = await Promise.all([caches.open(PAGES), caches.open(STATIC)]);
      let done = 0;
      const one = async (n: number) => {
        const urls = [`/api/surah/${n}`, `/data/similar/${n}.json`, `/data/tafsir/${tafsirLang}/${n}.json`];
        if (lang !== "en") urls.push(`/data/translations/${lang}/${n}.json`);
        await Promise.all([pages.add(`/surah/${n}`), data.addAll(urls)]);
        done += 1;
        setProgress(done);
      };
      const queue = Array.from({ length: TOTAL_SURAHS }, (_, i) => i + 1);
      // Four at a time keeps the browser responsive.
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          while (queue.length) await one(queue.shift()!);
        }),
      );
      await pages.addAll(["/", "/library", "/review", "/bookmarks"]);
      libraryStore.set({ offlineAt: Date.now() });
      notify.success("Saved for offline reading", { description: "All 114 surahs with your translation and tafsir." });
    } catch {
      notify.error("Couldn't finish saving", { description: "Check your connection and try again. Saved surahs stay available." });
    } finally {
      setProgress(null);
    }
  };

  return (
    <section aria-labelledby="offline-title" className="rounded-2xl border border-secondary bg-primary p-6 shadow-xs">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <FeaturedIcon icon={WifiOff} color="brand" theme="light" size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="offline-title" className="font-display text-xl font-medium text-primary">
              Read offline
            </h3>
            {offlineAt && (
              <BadgeWithIcon type="pill-color" color="success" size="sm" iconLeading={CheckCircle}>
                Saved {new Date(offlineAt).toLocaleDateString("en", { day: "numeric", month: "short" })}
              </BadgeWithIcon>
            )}
          </div>
          <p className="mt-1 max-w-xl text-sm text-tertiary">
            Install Mishkah from your browser’s menu (“Install app” or “Add to Home Screen”), then save every surah with your translation and tafsir,
            about 25 MB. Recitation audio still needs a connection.
          </p>
          {progress !== null ? (
            <div className="mt-4 max-w-md">
              <ProgressBar value={progress} max={TOTAL_SURAHS} labelPosition="right" valueFormatter={(v) => `${v}/${TOTAL_SURAHS}`} />
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm" iconLeading={Download01} onPress={save}>
                {offlineAt ? "Update offline copy" : "Save all surahs"}
              </Button>
              <Badge type="modern" color="gray" size="sm">
                Translation: {lang.toUpperCase()} · Tafsir: {tafsirLang.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
