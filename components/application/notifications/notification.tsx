"use client";

import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle } from "@untitledui/icons";
import type { FC, ReactNode } from "react";
import { toast as sonner } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

/**
 * Floating notification (toast) in the Untitled UI "Notifications" anatomy, rendered through
 * sonner's headless `toast.custom` so positioning, stacking and swipe-to-dismiss still work.
 */
type Kind = "success" | "error" | "warning" | "info" | "neutral";

const ICONS: Record<Kind, FC<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: InfoCircle,
  neutral: InfoCircle,
};
const COLORS = { success: "success", error: "error", warning: "warning", info: "brand", neutral: "gray" } as const;

export interface NotifyOptions {
  description?: ReactNode;
  icon?: FC<{ className?: string }>;
  action?: { label: string; onPress: () => void };
  /** Stable id: a repeat replaces the visible toast instead of stacking a duplicate. */
  id?: string;
  duration?: number;
}

function show(kind: Kind, title: ReactNode, opts: NotifyOptions = {}) {
  return sonner.custom(
    (id) => (
      <div
        role={kind === "error" ? "alert" : "status"}
        className="relative flex w-[min(400px,calc(100vw-2rem))] gap-4 rounded-xl bg-primary_alt p-4 shadow-lg ring-1 ring-secondary_alt"
      >
        <FeaturedIcon icon={opts.icon ?? ICONS[kind]} color={COLORS[kind]} theme="outline" size="sm" className="shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-6">
          <p className="text-sm font-semibold text-secondary">{title}</p>
          {opts.description && <p className="text-sm text-tertiary">{opts.description}</p>}
          {opts.action && (
            <div className="mt-2 flex gap-3">
              <Button color="link-gray" size="sm" onPress={() => sonner.dismiss(id)}>
                Dismiss
              </Button>
              <Button
                color="link-color"
                size="sm"
                onPress={() => {
                  opts.action!.onPress();
                  sonner.dismiss(id);
                }}
              >
                {opts.action.label}
              </Button>
            </div>
          )}
        </div>
        <CloseButton size="sm" label="Close" onClick={() => sonner.dismiss(id)} className="absolute top-2 right-2" />
      </div>
    ),
    { id: opts.id, duration: opts.duration ?? (opts.action ? 6000 : 3500) },
  );
}

export const notify = {
  success: (title: ReactNode, opts?: NotifyOptions) => show("success", title, opts),
  error: (title: ReactNode, opts?: NotifyOptions) => show("error", title, opts),
  warning: (title: ReactNode, opts?: NotifyOptions) => show("warning", title, opts),
  info: (title: ReactNode, opts?: NotifyOptions) => show("info", title, opts),
  neutral: (title: ReactNode, opts?: NotifyOptions) => show("neutral", title, opts),
};
