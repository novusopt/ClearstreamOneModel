import { ArrowRight, BookOpen01, Home02 } from "@untitledui/icons";
import Link from "next/link";
import { Button } from "@/components/base/buttons/button";
import { ErrorState } from "@/components/site/error-state";
import { getChapters } from "@/lib/quran";

/** 404: Untitled UI's not-found template, with ways back into the Qurʾān. */
export default function NotFound() {
  const chapters = getChapters();
  const popular = [1, 18, 36, 67].map((id) => chapters[id - 1]);
  return (
    <ErrorState
      code="٤٠٤"
      badge="404 error"
      title="We can’t find that page"
      description="The page you’re looking for doesn’t exist or has moved. Every surah is still here."
      actions={
        <>
          <Button size="xl" color="secondary" href="/" iconLeading={<Home02 data-icon aria-hidden="true" />}>
            Take me home
          </Button>
          <Button size="xl" href="/surah/1" iconLeading={<BookOpen01 data-icon aria-hidden="true" />}>
            Open Al-Fatihah
          </Button>
        </>
      }
    >
      <nav aria-label="Popular surahs" className="mt-12 w-full">
        <p className="text-sm font-semibold text-secondary">Popular surahs</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {popular.map((c) => (
            <li key={c.id}>
              <Link
                href={`/surah/${c.id}`}
                prefetch={false}
                className="group flex items-center justify-between gap-3 rounded-xl border border-secondary bg-primary px-4 py-3 text-left shadow-xs outline-focus-ring transition hover:border-brand focus-visible:outline-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-primary">
                    {c.id}. {c.nameSimple}
                  </span>
                  <span className="block truncate text-xs text-tertiary">{c.nameTranslation}</span>
                </span>
                <span lang="ar" dir="rtl" className="font-quran text-xl text-brand-secondary">
                  {c.nameArabic}
                </span>
                <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-fg-quaternary transition group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </ErrorState>
  );
}
