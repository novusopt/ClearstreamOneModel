"use client";

import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle } from "@untitledui/icons";
import type { FC, ReactNode } from "react";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

/**
 * Inline alert following the Untitled UI "Alerts" anatomy (the open-source React kit has no
 * alert component): outline featured icon, title + supporting text, link-style actions and an
 * optional close button.
 */
export type AlertColor = "brand" | "gray" | "success" | "warning" | "error";

const DEFAULT_ICONS: Record<AlertColor, FC<{ className?: string }>> = {
  brand: InfoCircle,
  gray: InfoCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const containers: Record<AlertColor, string> = {
  brand: "border-brand bg-brand-primary_alt",
  gray: "border-primary bg-primary_alt",
  success: "border-green-300 dark:border-green-800 bg-success-primary",
  warning: "border-yellow-300 dark:border-yellow-800 bg-warning-primary",
  error: "border-error_subtle bg-error-primary",
};

export interface AlertProps {
  color?: AlertColor;
  title: ReactNode;
  description?: ReactNode;
  icon?: FC<{ className?: string }>;
  /** Buttons, usually `Button` with `color="link-gray"` / `"link-color"` and `size="sm"`. */
  actions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
}

export const Alert = ({ color = "gray", title, description, icon, actions, onClose, closeLabel = "Dismiss", className }: AlertProps) => {
  const Icon = icon ?? DEFAULT_ICONS[color];
  return (
    <div
      role={color === "error" || color === "warning" ? "alert" : "status"}
      className={cx("relative flex flex-col gap-3 rounded-xl border p-4 shadow-xs sm:flex-row sm:gap-4", containers[color], className)}
    >
      <FeaturedIcon icon={Icon} color={color} theme="outline" size="sm" className="shrink-0 max-sm:-ml-1" />
      <div className={cx("flex min-w-0 flex-1 flex-col gap-3", onClose && "pr-8")}>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-secondary">{title}</p>
          {description && <div className="text-sm text-tertiary">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {onClose && <CloseButton size="sm" label={closeLabel} onClick={onClose} className="absolute top-2 right-2" />}
    </div>
  );
};
