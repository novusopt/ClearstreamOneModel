"use client";

import { Avatar, type AvatarProps } from "@/components/base/avatar/avatar";
import type { Reciter } from "@/lib/constants";
import { cx } from "@/utils/cx";

/*
 * A reciter's avatar: a licensed portrait when one is configured (`photo`), otherwise an emblem — the first
 * letter of the name the reciter is known by, in Amiri, on that reciter's own tone. Built on the Untitled UI
 * Avatar so sizes, rings and badges stay consistent.
 */
const TONES: Record<Reciter["tone"], string> = {
  gold: "bg-linear-to-br from-gold-300 via-gold-500 to-gold-700",
  indigo: "bg-linear-to-br from-brand-400 via-brand-600 to-brand-800",
  emerald: "bg-linear-to-br from-utility-emerald-400 via-utility-emerald-500 to-utility-emerald-700",
  sky: "bg-linear-to-br from-utility-sky-400 via-utility-sky-500 to-utility-sky-700",
  purple: "bg-linear-to-br from-utility-purple-400 via-utility-purple-500 to-utility-purple-700",
};

const LETTER: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "text-[1.25rem]",
  sm: "text-[1.75rem]",
  md: "text-[2.2rem]",
  lg: "text-[2.6rem]",
  xl: "text-[3rem]",
  "2xl": "text-[3.5rem]",
};

export function ReciterAvatar({
  reciter,
  size = "md",
  className,
  ...props
}: { reciter: Reciter } & Omit<AvatarProps, "src" | "alt" | "initials" | "placeholder" | "contentClassName">) {
  return (
    <Avatar
      size={size}
      src={reciter.photo}
      alt={reciter.name}
      className={className}
      contentClassName={cx(!reciter.photo && TONES[reciter.tone], "outline-white/20")}
      placeholder={
        <span lang="ar" aria-hidden="true" className={cx("-translate-y-[0.3em] font-quran leading-none text-white drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]", LETTER[size])}>
          {reciter.letter}
        </span>
      }
      {...props}
    />
  );
}

/* Amiri draws letters small for their em size and low on the line, hence the large sizes and the lift. */

/** Overlapping stack of reciter avatars (e.g. "5 reciters"). */
export function ReciterStack({ reciters, size = "sm", className }: { reciters: Reciter[]; size?: AvatarProps["size"]; className?: string }) {
  return (
    <span className={cx("flex -space-x-2", className)}>
      {reciters.map((r) => (
        <ReciterAvatar key={r.id} reciter={r} size={size} className="ring-2 ring-bg-primary" />
      ))}
    </span>
  );
}
