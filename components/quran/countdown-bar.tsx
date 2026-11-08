"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";

/**
 * Untitled UI ProgressBar that fills linearly over `seconds` (e.g. the "Your turn" pause).
 * Re-key it to restart.
 */
export function CountdownBar({ seconds, className, progressClassName }: { seconds: number; className?: string; progressClassName?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    // Two frames so the empty bar is painted before the transition starts.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setValue(100));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);
  return (
    <div className="w-full" style={{ "--countdown": `${seconds}s` } as CSSProperties}>
      <ProgressBarBase value={value} className={className} progressClassName={cx("ease-linear [transition-duration:var(--countdown)]", progressClassName)} />
    </div>
  );
}
