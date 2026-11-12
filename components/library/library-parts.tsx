"use client";

import { ArrowDown, ArrowUp } from "@untitledui/icons";
import type { FC, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

export type Icon = FC<{ className?: string }>;

const subscribeNone = () => () => {};
/** True after hydration: the pages are prerendered, so anything that reads today's date waits for it. */
export const useMounted = () =>
  useSyncExternalStore(
    subscribeNone,
    () => true,
    () => false,
  );

/** Untitled UI card: header (title, supporting text, actions), optional divider, body. */
export function Card({
  title,
  description,
  icon,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: Icon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={cx("flex flex-col rounded-2xl bg-primary shadow-xs ring-1 ring-secondary", className)}>
      {title && (
        <header className="flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-secondary px-5 py-4 md:px-6">
          {icon && <FeaturedIcon icon={icon} color="gray" theme="modern" size="md" className="shrink-0" />}
          <div className="min-w-0 flex-1 basis-48">
            <h2 id={id} className="text-lg font-semibold text-primary">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-tertiary">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:pl-14">{actions}</div>}
        </header>
      )}
      <div className={cx("flex-1 p-5 md:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Untitled UI metric card: icon and label, the number, then a trend badge or a quiet hint. */
export function Metric({
  icon,
  label,
  value,
  trend,
  hint,
  children,
}: {
  icon: Icon;
  label: string;
  value: ReactNode;
  trend?: number | null;
  hint?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary sm:gap-4 sm:p-5">
      <div className="flex items-center gap-3">
        <FeaturedIcon icon={icon} color="gray" theme="modern" size="sm" />
        <p className="text-sm font-medium text-tertiary">{label}</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <p className="text-display-xs font-semibold tracking-tight text-primary tabular-nums sm:text-display-sm">{value}</p>
        {trend != null && Number.isFinite(trend) && (
          <BadgeWithIcon type="pill-color" color={trend >= 0 ? "success" : "error"} size="sm" iconLeading={trend >= 0 ? ArrowUp : ArrowDown}>
            {Math.abs(Math.round(trend))}%
          </BadgeWithIcon>
        )}
      </div>
      {children}
      {hint && <p className="-mt-1 text-xs text-tertiary sm:-mt-2 sm:text-sm">{hint}</p>}
    </div>
  );
}

/** "1 ayah" / "2 ayat". */
export const ayatCount = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "ayah" : "ayat"}`;
