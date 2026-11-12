"use client";

import type { SVGProps } from "react";
import { cx } from "@/utils/cx";
import { Circle } from "./circle";
import { Grid } from "./grid";
import { Square } from "./square";

// Mishkah: "grid-check" (./grid-check.tsx, ~140 KB of SVG) is left out of this map so it is not bundled
// wherever an empty state or error page draws a pattern; import it directly if a page ever needs it.
const patterns = {
    circle: Circle,
    square: Square,
    grid: Grid,
};

export interface BackgroundPatternProps extends Omit<SVGProps<SVGSVGElement>, "size"> {
    size?: "sm" | "md" | "lg";
    pattern: keyof typeof patterns;
}

export const BackgroundPattern = (props: BackgroundPatternProps) => {
    const { pattern } = props;
    const Pattern = patterns[pattern];

    return <Pattern {...props} size={props.size as "sm" | "md"} className={cx("pointer-events-none", props.className)} />;
};
