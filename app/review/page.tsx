import type { Metadata } from "next";
import { ReviewSession } from "@/components/library/review-session";
import { getChapters } from "@/lib/quran";

// Personal, device-local page: keep it out of search results.
export const metadata: Metadata = { title: "Review", robots: { index: false, follow: true } };

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-24 md:px-8">
      <p className="text-sm font-semibold text-brand-secondary">Memorisation</p>
      <h1 className="mt-2 font-display text-display-sm font-medium tracking-tight text-primary">Today’s review</h1>
      <p className="mt-2 max-w-xl text-tertiary">
        Ayat you have memorised come back at growing intervals (1 day, 3 days, then longer), so they stay firm. Recite, check, and grade yourself honestly.
      </p>
      <ReviewSession chapters={getChapters()} />
    </div>
  );
}
