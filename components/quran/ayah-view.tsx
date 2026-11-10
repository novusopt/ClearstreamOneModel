import { ArrowLeft, ArrowRight, BookOpen02, ChevronRight, Copy07 } from "@untitledui/icons";
import Link from "next/link";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { AyahActions } from "@/components/quran/ayah-actions";
import { AyahMarker } from "@/components/quran/ayah-marker";
import { quarterLabel } from "@/components/quran/hizb-mark";
import { LanguageLinks } from "@/components/quran/language-links";
import { TajweedText } from "@/components/quran/tajweed-text";
import { HtmlLang } from "@/components/seo/html-lang";
import { JsonLd } from "@/components/seo/json-ld";
import type { AyahData } from "@/lib/ayah-page";
import { ayahName } from "@/lib/ayah-names";
import { isSajdah, juzOf, TAFSIR_SOURCE } from "@/lib/constants";
import { localePath, t, translator } from "@/lib/i18n";
import { getChapter } from "@/lib/quran";
import { ayahLd, breadcrumbLd } from "@/lib/seo";
import { ayahPath, surahPath } from "@/lib/site";

function SectionTitle({ icon: Icon, children }: { icon: typeof BookOpen02; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-xl font-medium text-primary">
      <Icon aria-hidden="true" className="size-5 text-fg-brand-secondary" />
      {children}
    </h2>
  );
}

/**
 * One ayah page (English at /surah/2/255, localized at /fr/surah/2/255 …): the Arabic with tajweed,
 * transliteration, translation, word-by-word meanings, the Al-Mukhtaṣar tafsir and look-alike
 * ayat. Fully server-rendered; only the Listen/Share buttons are a client island.
 */
export function AyahView({ d }: { d: AyahData }) {
  const { chapter, verse, ayah, id, lang, similar } = d;
  const s = t(lang);
  const L = (path: string) => localePath(lang, path);
  const named = ayahName(id, ayah);
  const arabic = verse.w.map((w) => w.a).join(" ");
  const ref = `${id}:${ayah}`;
  const prevCh = ayah === 1 ? getChapter(id - 1) : chapter;
  const prev = ayah > 1 ? { s: id, a: ayah - 1, ch: chapter } : prevCh ? { s: prevCh.id, a: prevCh.versesCount, ch: prevCh } : null;
  const nextCh = ayah === chapter.versesCount ? getChapter(id + 1) : chapter;
  const next = ayah < chapter.versesCount ? { s: id, a: ayah + 1, ch: chapter } : nextCh ? { s: nextCh.id, a: 1, ch: nextCh } : null;
  const audio = { n: verse.n, g: verse.g, t: verse.w.map((w) => (w.s != null && w.f != null ? ([w.s, w.f] as [number, number]) : null)), a: verse.w.map((w) => w.a) };
  const readerHref = lang === "en" ? `${surahPath(id)}#v-${ayah}` : `${surahPath(id)}?t=${lang}#v-${ayah}`;
  const translationRtl = s.dir === "rtl";

  return (
    <article lang={s.code} dir={s.dir} className="relative overflow-hidden pt-28 pb-32 md:pt-32">
      {lang !== "en" && <HtmlLang lang={s.code} />}
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Mishkah", path: "/" },
            { name: s.surahHeading(chapter), path: L(surahPath(id)) },
            { name: `${s.ayah} ${ref}`, path: L(ayahPath(id, ayah)) },
          ]),
          ayahLd(chapter, ayah, arabic, d.translation, named?.name, { lang: s.code, translator: translator(lang), path: L(ayahPath(id, ayah)) }),
        ]}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/60" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
          <Button href={lang === "en" ? "/#surahs" : L(surahPath(id))} color="link-gray" size="sm">
            {lang === "en" ? s.surahs : s.surahHeading(chapter)}
          </Button>
          {lang === "en" && (
            <>
              <ChevronRight aria-hidden="true" className="size-4 text-fg-quaternary rtl:rotate-180" />
              <Button href={surahPath(id)} color="link-gray" size="sm">
                {chapter.nameSimple}
              </Button>
            </>
          )}
          <ChevronRight aria-hidden="true" className="size-4 text-fg-quaternary rtl:rotate-180" />
          <span aria-current="page" className="font-semibold text-brand-secondary tabular-nums">
            {ref}
          </span>
        </nav>

        <header className="mt-6">
          <p className="text-sm font-semibold text-gold-700 dark:text-gold-300">
            {s.surahHeading(chapter)} · {s.ayah} {ayah}/{chapter.versesCount}
          </p>
          <h1 className="mt-2 font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md">
            {named ? (
              <>
                {named.name} <span className="text-tertiary">· {ref}</span>
              </>
            ) : (
              <>
                {chapter.nameSimple} {ref}
              </>
            )}
          </h1>
          {lang === "en" && named?.also && <p className="mt-2 text-md text-tertiary">Also known as {named.also.join(", ")}</p>}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge type="pill-color" size="sm" color={chapter.revelation === "meccan" ? "warning" : "brand"}>
              {chapter.revelation === "meccan" ? s.meccan : s.medinan}
            </Badge>
            <Link href={`/juz/${juzOf(id, ayah)}`} prefetch={false} className="rounded-md outline-focus-ring focus-visible:outline-2">
              <Badge type="modern" size="sm">
                {s.juz} {juzOf(id, ayah)}
              </Badge>
            </Link>
            {verse.p && (
              <Link href={`/page/${verse.p}`} prefetch={false} className="rounded-md outline-focus-ring focus-visible:outline-2">
                <Badge type="modern" size="sm">
                  {s.pages(verse.p, verse.p)}
                </Badge>
              </Link>
            )}
            {verse.q && (
              <Badge type="pill-color" size="sm" color="warning">
                ۞ {quarterLabel(verse.q)}
              </Badge>
            )}
            {isSajdah(id, ayah) && (
              <Badge type="pill-color" size="sm" color="warning">
                ۩ Sajdah
              </Badge>
            )}
          </div>
        </header>

        <section aria-label={s.translation} className="mt-8 rounded-3xl border border-secondary bg-primary p-6 shadow-xs sm:p-10">
          <p dir="rtl" lang="ar" className="text-center font-quran text-4xl leading-[2.3] text-primary sm:text-5xl">
            {verse.w.map((w, i) => (
              <span key={i}>
                <TajweedText value={w.j} />{" "}
              </span>
            ))}
            <span className="font-quran">
              <AyahMarker n={ayah} />
            </span>
          </p>
          <p dir="ltr" lang="ar-Latn" className="mt-6 text-center font-display text-md text-brand-tertiary italic">
            {verse.tr}
          </p>
          <blockquote dir={translationRtl ? "rtl" : "ltr"} className="mt-4 border-gold-400 text-lg text-secondary ltr:border-l-2 ltr:pl-4 rtl:border-r-2 rtl:pr-4">
            {d.translation}
            <footer className="mt-1 text-sm text-quaternary">{translator(lang)}</footer>
          </blockquote>
          <div className="mt-8 border-t border-secondary pt-6">
            <AyahActions
              surah={id}
              surahName={chapter.nameSimple}
              audio={audio}
              title={`${chapter.nameSimple} ${ref}`}
              contextHref={readerHref}
              labels={{ listen: s.listen, pause: s.pause, context: s.openReader, share: s.share, linkCopied: s.linkCopied }}
            />
          </div>
        </section>

        <section aria-labelledby="wbw" className="mt-12">
          <h2 id="wbw" className="font-display text-xl font-medium text-primary">
            {s.wordByWord}
          </h2>
          <ol dir="rtl" lang="ar" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {verse.w.map((w, i) => (
              <li key={i} className="flex flex-col items-center rounded-2xl border border-secondary bg-primary px-3 py-4 text-center">
                <span className="font-quran text-3xl leading-[1.9] text-primary">
                  <TajweedText value={w.j} />
                </span>
                <span dir="ltr" className="font-display text-sm text-gold-700 italic dark:text-gold-300">
                  {w.t}
                </span>
                <span dir="ltr" lang="en" className="mt-0.5 text-sm text-secondary">
                  {w.e}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {d.tafsir && (
          <section aria-labelledby="tafsir" className="mt-12">
            <SectionTitle icon={BookOpen02}>
              <span id="tafsir">{d.tafsirLang === lang ? s.explanation : s.explanationEnglish}</span>
            </SectionTitle>
            <p className="mt-1 text-sm text-tertiary" dir="ltr">
              {TAFSIR_SOURCE.name} · {TAFSIR_SOURCE.author}
            </p>
            <p
              lang={d.tafsirLang === "zh" ? "zh-Hans" : d.tafsirLang}
              dir="ltr"
              className="mt-4 rounded-2xl border border-secondary bg-secondary/60 p-5 text-md leading-relaxed text-secondary"
            >
              {d.tafsir}
            </p>
          </section>
        )}

        {similar.length > 0 && (
          <section aria-labelledby="similar" className="mt-12">
            <SectionTitle icon={Copy07}>
              <span id="similar">{s.similarWording}</span>
            </SectionTitle>
            <ul className="mt-4 space-y-2">
              {similar.map((x) => (
                <li key={`${x.s}:${x.a}`}>
                  <Link
                    href={L(ayahPath(x.s, x.a))}
                    prefetch={false}
                    className="flex items-center gap-4 rounded-2xl border border-secondary bg-primary px-4 py-3 outline-focus-ring transition hover:border-brand hover:bg-secondary/40 focus-visible:outline-2"
                  >
                    <span dir="ltr" className="shrink-0 text-sm font-semibold text-secondary tabular-nums">
                      {x.n} {x.s}:{x.a}
                    </span>
                    <span dir="rtl" lang="ar" className="min-w-0 flex-1 truncate font-quran text-2xl text-primary">
                      {x.t}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav aria-label={`${s.previousAyah} / ${s.nextAyah}`} className="mt-14 grid gap-3 border-t border-secondary pt-8 sm:grid-cols-2">
          {prev ? (
            <Link href={L(ayahPath(prev.s, prev.a))} className="group rounded-2xl border border-secondary bg-primary p-4 outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center gap-1.5 text-sm text-tertiary">
                <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" /> {s.previousAyah}
              </span>
              <span className="mt-1 block font-semibold text-primary">
                {prev.ch.nameSimple} {prev.s}:{prev.a}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={L(ayahPath(next.s, next.a))} className="group rounded-2xl border border-secondary bg-primary p-4 text-end outline-focus-ring transition hover:border-brand focus-visible:outline-2">
              <span className="flex items-center justify-end gap-1.5 text-sm text-tertiary">
                {s.nextAyah} <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
              </span>
              <span className="mt-1 block font-semibold text-primary">
                {next.ch.nameSimple} {next.s}:{next.a}
              </span>
            </Link>
          )}
        </nav>
        <div className="mt-6 flex justify-center">
          <Button color="link-color" href={L(surahPath(id))} iconTrailing={<ArrowRight data-icon aria-hidden="true" className="size-5 rtl:rotate-180" />}>
            {s.readAll(chapter)}
          </Button>
        </div>
        <LanguageLinks current={lang} path={ayahPath(id, ayah)} className="mt-10 justify-center" />
      </div>
    </article>
  );
}
