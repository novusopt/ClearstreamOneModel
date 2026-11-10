import type { ReactNode } from "react";
import { Badge } from "@/components/base/badges/badges";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";

/**
 * Full-page error state following the Untitled UI 404/500 page template: a pill badge with the
 * error code, a display heading, supporting text and a pair of actions, over the grid background
 * pattern. Mishkah's touch: the code in Arabic-Indic numerals behind the heading.
 */
export function ErrorState({
  code,
  badge,
  title,
  description,
  actions,
  children,
}: {
  code: string;
  badge: string;
  title: string;
  description: ReactNode;
  actions: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate flex min-h-[78vh] items-center overflow-hidden px-4 pt-28 pb-20">
      <BackgroundPattern
        pattern="grid"
        size="lg"
        aria-hidden="true"
        className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 text-border-secondary [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <p aria-hidden="true" className="font-quran text-7xl leading-none text-gold-500/80 md:text-8xl">
          {code}
        </p>
        <Badge type="pill-color" color="brand" size="md" className="mt-6">
          {badge}
        </Badge>
        <h1 className="mt-4 font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md">{title}</h1>
        <div className="mt-4 max-w-lg text-lg text-tertiary md:text-xl">{description}</div>
        <div className="mt-8 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">{actions}</div>
        {children}
      </div>
    </section>
  );
}
