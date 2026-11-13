"use client";

import { Check, XClose } from "@untitledui/icons";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/app/bits";
import { runProgress } from "@/lib/pipeline";
import type { PipelineRun } from "@/lib/types";
import { cx } from "@/utils/cx";

/** Follows a pipeline run step by step. The mock backend derives progress from the run's start time. */
export function PipelineProgress({ run }: { run: PipelineRun }) {
  const router = useRouter();
  const pathname = usePathname();
  const [now, setNow] = useState(() => Date.now());
  const progress = runProgress(run, now);

  useEffect(() => {
    if (progress.finished) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [progress.finished]);

  useEffect(() => {
    if (progress.finished) router.refresh();
  }, [progress.finished, router]);

  return (
    <section aria-label="Pipeline run" className="animate-rise overflow-hidden rounded-xl border border-ink-700 bg-ink-900 text-ink-100 shadow-lg">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 pt-4">
        <Eyebrow className="text-ink-300">Simulated pipeline · {run.id}</Eyebrow>
        <button type="button" aria-label="Dismiss" onClick={() => router.replace(pathname)} className="ml-auto cursor-pointer rounded p-1 text-ink-300 outline-brand-300 hover:text-white focus-visible:outline-2">
          <XClose className="size-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5">
        <h2 className="font-display text-lg font-semibold text-white">{run.title}</h2>
        <p aria-live="polite" className="text-sm text-ink-300">
          {progress.finished ? "Finished. The change is live." : `${progress.percent}%`}
        </p>
      </div>
      <div className="mx-5 mt-3 h-1 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full bg-brand-400 transition-[width] duration-300 ease-linear" style={{ width: `${progress.percent}%` }} />
      </div>
      <ol className="grid gap-x-6 gap-y-3 px-5 pt-4 pb-5 sm:grid-cols-2 xl:grid-cols-4">
        {progress.steps.map((step, index) => (
          <li key={step.key} className="flex gap-3">
            <span
              className={cx(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px]",
                step.state === "done" && "bg-brand-400 text-ink-950",
                step.state === "running" && "bg-accent-amber text-ink-950 ring-4 ring-accent-amber/25",
                step.state === "pending" && "border border-ink-600 text-ink-400",
              )}
            >
              {step.state === "done" ? <Check className="size-3" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className={cx("block text-sm font-medium", step.state === "pending" ? "text-ink-400" : "text-white")}>{step.label}</span>
              <span className="block text-xs leading-4.5 text-ink-400">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
