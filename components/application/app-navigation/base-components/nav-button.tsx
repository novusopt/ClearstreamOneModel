"use client";

import type { FC, ReactNode } from "react";
import { Link as AriaLink } from "react-aria-components";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";

/*
 * Untitled UI NavButton (github.com/untitleduico/react, app-navigation/base-components/nav-button.tsx).
 * Mishkah change: renders a React Aria Link instead of a plain <a>, so navigation goes through the app's
 * RouterProvider (client-side transitions) and the button takes `onPress`.
 */
interface NavButtonProps {
    /** URL to navigate to when the button is clicked. */
    href?: string;
    /** Label text for the button (tooltip + accessible name for icon-only buttons). */
    label?: string;
    /** Icon component to display. */
    icon?: FC<{ className?: string }>;
    /** Whether the button is currently active. */
    current?: boolean;
    /** Handler for press events. */
    onPress?: () => void;
    /** Additional CSS classes to apply to the button. */
    className?: string;
    /** Placement of the tooltip. */
    tooltipPlacement?: "top" | "right" | "bottom" | "left";
    /** Content to display. */
    children?: ReactNode;
}

export const NavButton = ({ current, label, href, icon: Icon, className, tooltipPlacement = "right", onPress, children }: NavButtonProps) => {
    const iconOnly = !children;

    const link = (
        <AriaLink
            href={href}
            aria-label={iconOnly ? label : undefined}
            aria-current={current ? "page" : undefined}
            onPress={onPress}
            className={cx(
                "group/item relative flex w-full cursor-pointer items-center justify-center gap-1 rounded-md outline-focus-ring transition duration-100 ease-linear select-none hover:bg-primary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                current && "bg-secondary hover:bg-secondary_hover",
                iconOnly ? "size-9" : "px-2 py-1.5",
                className,
            )}
        >
            {Icon && (
                <Icon
                    aria-hidden="true"
                    className={cx(
                        "size-5 shrink-0 text-fg-quaternary transition-inherit-all group-hover/item:text-fg-quaternary_hover",
                        current && "text-fg-quaternary_hover",
                    )}
                />
            )}

            {children && (
                <span
                    className={cx(
                        "flex items-center gap-1.5 px-0.5 text-sm font-semibold text-secondary transition duration-100 ease-linear group-hover/item:text-secondary_hover",
                        current && "text-secondary_hover",
                    )}
                >
                    {children}
                </span>
            )}
        </AriaLink>
    );

    if (!label || !iconOnly) return link;
    return (
        <Tooltip title={label} placement={tooltipPlacement}>
            {link}
        </Tooltip>
    );
};
