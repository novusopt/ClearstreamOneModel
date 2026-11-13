import { ChevronRight } from "@untitledui/icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { LIFECYCLE_META } from "@/lib/lifecycle";
import type { LifecycleStatus } from "@/lib/types";
import { cx } from "@/utils/cx";

const STATUS_COLOR = { proposed: "gray", draft: "blue", active: "success", deprecated: "warning", retired: "slate" } as const;
export const STATUS_DOT: Record<LifecycleStatus, string> = {
  proposed: "bg-utility-neutral-400",
  draft: "bg-utility-blue-500",
  active: "bg-utility-green-500",
  deprecated: "bg-utility-amber-500",
  retired: "bg-utility-slate-500",
};

export function LifecycleBadge({ status, size = "sm" }: { status: LifecycleStatus; size?: "sm" | "md" }) {
  return (
    <BadgeWithDot type="pill-color" size={size} color={STATUS_COLOR[status]}>
      {LIFECYCLE_META[status].label}
    </BadgeWithDot>
  );
}

/** Identifiers, versions and anything else that is literally typed somewhere. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("font-mono text-[0.92em] tracking-tight", className)}>{children}</span>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("font-mono text-[11px] font-medium tracking-[0.08em] text-tertiary uppercase", className)}>{children}</p>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-xl border border-secondary bg-primary shadow-xs", className)}>{children}</section>;
}

export function CardHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-secondary px-5 py-4">
      <div className="min-w-0">
        <h2 className="font-display text-md font-semibold text-primary">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-tertiary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-tertiary">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="size-3.5 text-quaternary" />}
          {item.href ? (
            <Link href={item.href} className="rounded outline-brand hover:text-secondary focus-visible:outline-2">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-secondary">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({ eyebrow, title, description, actions, children }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="border-b border-secondary bg-primary px-5 pt-6 pb-5 sm:px-8">
      {eyebrow && <div className="mb-3">{eyebrow}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-display-xs font-semibold tracking-tight text-primary sm:text-display-sm">{title}</h1>
          {description && <p className="mt-1.5 max-w-3xl text-md text-tertiary">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** A short pass/fail history, oldest first. */
export function HistoryStrip({ history }: { history: ("passed" | "failed")[] }) {
  const failures = history.filter((entry) => entry === "failed").length;
  return (
    <span role="img" aria-label={`${history.length} runs, ${failures} failed`} className="flex items-end gap-0.5">
      {history.map((entry, index) => (
        <span key={index} className={cx("w-1 rounded-full", entry === "passed" ? "h-3 bg-utility-green-400" : "h-4.5 bg-utility-red-500")} />
      ))}
    </span>
  );
}

export const formatDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

export function describeSchedule(cron: string): string {
  const known: Record<string, string> = { "0 * * * *": "Hourly", "0 6 * * *": "Daily at 06:00", "0 6 * * 1": "Weekly, Monday 06:00", "0 7 1 * *": "Monthly, 1st at 07:00" };
  if (known[cron]) return known[cron];
  const [minute, hour, day, month, weekday] = cron.split(" ");
  if (day === "*" && month === "*" && weekday === "*" && /^\d+$/.test(minute) && /^\d+$/.test(hour)) return `Daily at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  return cron;
}
