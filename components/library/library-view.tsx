"use client";

import {
  ArrowRight,
  BarChartSquare02,
  BookOpen01,
  Bookmark,
  Calendar,
  CheckCircle,
  CheckVerified01,
  Edit05,
  Flag05,
  Lock01,
  PieChart03,
  RefreshCw01,
  SearchLg,
  Target04,
  Trash01,
  TrendUp01,
  Trophy01,
  Zap,
} from "@untitledui/icons";
import { m } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Tabs } from "@/components/application/tabs/tabs";
import { Badge, BadgeWithButton } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { ProgressBarCircle } from "@/components/base/progress-indicators/progress-circles";
import { ProgressBar, ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ayatCount, Card, Metric, useMounted } from "@/components/library/library-parts";
import { OfflineCard } from "@/components/library/offline-card";
import { BookmarkList } from "@/components/quran/bookmark-list";
import { JUZ_STARTS, TOTAL_AYAT } from "@/lib/constants";
import {
  addDays,
  dueReviews,
  type LibraryState,
  nextReviewDate,
  planStatus,
  saveNote,
  startPlan,
  stopPlan,
  streak,
  today,
  toggleMemorised,
  totalRead,
  useLibrary,
} from "@/lib/library";
import type { Chapter } from "@/lib/types";
import { cx } from "@/utils/cx";

export type LibraryTab = "progress" | "bookmarks" | "notes" | "memorised";

const PLANS = [
  { days: 7, label: "1 week" },
  { days: 30, label: "30 days" },
  { days: 60, label: "2 months" },
  { days: 365, label: "1 year" },
];

const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en", opts);
const pct = (n: number, of: number) => (of ? (n / of) * 100 : 0);
const fmtPct = (p: number) => (p > 0 && p < 10 ? `${p.toFixed(1)}%` : `${Math.round(p)}%`);

/* Statistics ------------------------------------------------------------------------------------ */

/** Ayat read in the `days` days ending `offset` days ago. */
function sumDays(log: LibraryState["log"], days: number, offset = 0) {
  let n = 0;
  for (let i = offset; i < offset + days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    n += log[today(d)] ?? 0;
  }
  return n;
}

/** The longest run of consecutive reading days. */
function bestStreak(log: LibraryState["log"]) {
  const days = Object.keys(log)
    .filter((k) => log[k] > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Surahs and juzʾ read in full. */
function completion(chapters: Chapter[], read: LibraryState["read"]) {
  const offsets: number[] = [];
  let g = 0;
  for (const c of chapters) {
    offsets[c.id] = g;
    g += c.versesCount;
  }
  const seen = new Uint8Array(TOTAL_AYAT + 1);
  for (const [s, list] of Object.entries(read)) for (const a of list) seen[offsets[Number(s)] + a] = 1;
  const starts = JUZ_STARTS.map(([s, a]) => offsets[s] + a);
  let juz = 0;
  starts.forEach((start, i) => {
    const end = (starts[i + 1] ?? TOTAL_AYAT + 1) - 1;
    let all = true;
    for (let k = start; k <= end && all; k++) all = seen[k] === 1;
    if (all) juz++;
  });
  const surahs = chapters.filter((c) => (read[c.id]?.length ?? 0) >= c.versesCount);
  return { surahs, juz };
}

/* Header and continue card ---------------------------------------------------------------------- */

function LibraryHeader() {
  const due = useLibrary((s) => dueReviews(s).length);
  const memorised = useLibrary((s) => s.memorised.length);
  const mounted = useMounted();
  return (
    <header className="flex flex-col gap-5 border-b border-secondary pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-secondary">
          <Lock01 aria-hidden="true" className="size-4" />
          Private, saved on this device
        </p>
        <h1 className="mt-2 font-display text-display-sm font-medium tracking-tight text-primary">Your library</h1>
        <p className="mt-2 max-w-xl text-md text-tertiary">Reading progress and plans, bookmarks, notes and the ayat you have memorised.</p>
      </div>
      {mounted && memorised > 0 && (
        <Button color="secondary" href="/review" iconLeading={RefreshCw01} className="self-start md:self-auto">
          {due > 0 ? `Review · ${due} due` : "Review"}
        </Button>
      )}
    </header>
  );
}

function ContinueCard({ chapters }: { chapters: Chapter[] }) {
  const lastRead = useLibrary((s) => s.lastRead);
  const read = useLibrary((s) => (s.lastRead ? (s.read[s.lastRead.surah]?.length ?? 0) : 0));
  if (!lastRead) return null;
  const ch = chapters[lastRead.surah - 1];
  if (!ch) return null;
  const p = pct(read, ch.versesCount);
  return (
    <m.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Continue reading"
      className="relative isolate mt-8 overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-gold-50 via-transparent to-brand-50/60 dark:from-gold-500/10 dark:to-brand-900/40"
      />
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center md:p-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-xs ring-1 ring-secondary">
          <span lang="ar" dir="rtl" className="font-quran text-2xl leading-none text-brand-secondary">
            {ch.nameArabic}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gold-700 dark:text-gold-300">Continue where you left off</p>
          <h2 className="mt-0.5 font-display text-xl font-medium text-primary">
            {ch.nameSimple} <span className="text-tertiary">· Ayah {lastRead.ayah}</span>
          </h2>
          <div className="mt-3 max-w-md">
            <ProgressBar value={read} max={ch.versesCount} labelPosition="right" valueFormatter={() => `${fmtPct(p)} of the surah`} />
          </div>
        </div>
        <Button size="lg" href={`/surah/${ch.id}#v-${lastRead.ayah}`} iconTrailing={ArrowRight} className="self-start sm:self-center">
          Continue reading
        </Button>
      </div>
    </m.section>
  );
}

/* Progress tab ---------------------------------------------------------------------------------- */

function ActivityCard({ log }: { log: LibraryState["log"] }) {
  const mounted = useMounted();
  const [range, setRange] = useState(14);
  const todayKey = mounted ? today() : "";
  const days = Array.from({ length: range }, (_, i) => {
    if (!mounted) return { key: `day-${i}`, count: 0, label: "", full: "" };
    const d = new Date();
    d.setDate(d.getDate() - (range - 1 - i));
    const key = today(d);
    const label =
      range === 14
        ? d.toLocaleDateString("en", { weekday: "narrow" })
        : i % 5 === 4 || i === range - 1
          ? d.toLocaleDateString("en", { day: "numeric", month: "short" })
          : "";
    return { key, count: log[key] ?? 0, label, full: d.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" }) };
  });
  const total = days.reduce((n, d) => n + d.count, 0);
  const top = Math.max(10, ...days.map((d) => d.count));
  const max = Math.ceil(top / 10) * 10;

  return (
    <Card
      id="activity-title"
      title="Reading activity"
      description={mounted ? `${ayatCount(total)} in the last ${range} days · ${Math.round(total / range)} a day on average` : "Ayat read per day"}
      icon={BarChartSquare02}
      actions={
        <ButtonGroup size="sm" selectedKeys={[String(range)]} disallowEmptySelection onSelectionChange={(k) => setRange(Number([...k][0]))} aria-label="Range">
          <ButtonGroupItem id="14">14 days</ButtonGroupItem>
          <ButtonGroupItem id="30">30 days</ButtonGroupItem>
        </ButtonGroup>
      }
      className="lg:col-span-2"
      bodyClassName="flex flex-col"
    >
      <div className="flex min-h-48 flex-1 gap-3">
        <div aria-hidden="true" className="flex flex-col justify-between pb-6 text-right text-xs text-quaternary tabular-nums">
          <span>{max}</span>
          <span>{max / 2}</span>
          <span>0</span>
        </div>
        <div className="relative min-h-48 flex-1">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cx("border-t", i === 2 ? "border-secondary" : "border-dashed border-secondary")} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-end gap-1 sm:gap-1.5" role="img" aria-label={`Ayat read per day: ${days.map((d) => d.count).join(", ")}`}>
            {days.map((d, i) => (
              <div key={d.key} className="group/bar relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="relative flex w-full flex-1 items-end justify-center">
                  {d.count > 0 && (
                    <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-lg bg-primary-solid px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-lg group-hover/bar:block">
                      {d.full} · {ayatCount(d.count)}
                    </span>
                  )}
                  <m.span
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
                    transition={{ delay: i * 0.015, duration: 0.5 }}
                    className={cx(
                      "w-full max-w-7 rounded-t-md",
                      d.count ? (d.key === todayKey ? "bg-gold-400" : "bg-brand-solid group-hover/bar:bg-brand-solid_hover") : "bg-quaternary",
                    )}
                  />
                </div>
                <span className="h-4 text-[10px] leading-4 whitespace-nowrap text-quaternary">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-tertiary">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-brand-solid" /> Ayat read
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-gold-400" /> Today
        </span>
      </div>
    </Card>
  );
}

function KhatmCard({ chapters, read }: { chapters: Chapter[]; read: LibraryState["read"] }) {
  const done = totalRead(read);
  const { surahs, juz } = completion(chapters, read);
  const rows = [
    { label: "Ayat read", value: `${done.toLocaleString("en-US")} / ${TOTAL_AYAT.toLocaleString("en-US")}` },
    { label: "Surahs complete", value: `${surahs.length} / 114` },
    { label: "Juzʾ complete", value: `${juz} / 30` },
  ];
  return (
    <Card id="khatm-title" title="The whole Qurʾān" description="Every ayah you have read once" icon={PieChart03}>
      <div className="flex justify-center">
        <ProgressBarCircle size="sm" value={done} max={TOTAL_AYAT} label="Read" valueFormatter={(v) => fmtPct(pct(v, TOTAL_AYAT))} />
      </div>
      <dl className="mt-6 divide-y divide-secondary">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2.5 text-sm">
            <dt className="text-tertiary">{r.label}</dt>
            <dd className="font-semibold text-primary tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function PlanCard() {
  const plan = useLibrary((s) => s.plan);
  const read = useLibrary((s) => s.read);
  const log = useLibrary((s) => s.log);
  const lastRead = useLibrary((s) => s.lastRead);
  const mounted = useMounted();
  const [choice, setChoice] = useState("30");
  const status = plan && mounted ? planStatus(plan, { read, log }) : null;

  return (
    <Card
      id="plan-title"
      title="Reading plan"
      description="Complete the whole Qurʾān (a khatm) at a steady daily pace."
      icon={Target04}
      actions={
        plan && (
          <Button size="sm" color="tertiary" iconLeading={Flag05} onPress={stopPlan}>
            End plan
          </Button>
        )
      }
      className="lg:col-span-2"
    >
      {plan && status ? (
        <div className="space-y-6">
          <dl className="grid grid-cols-3 divide-x divide-secondary rounded-xl bg-secondary ring-1 ring-secondary">
            {[
              { label: "Day", value: `${status.day} of ${plan.days}` },
              { label: "Daily goal", value: ayatCount(status.daily) },
              { label: "Finish by", value: fmtDate(addDays(plan.start, plan.days - 1), { day: "numeric", month: "short", year: "numeric" }) },
            ].map((s) => (
              <div key={s.label} className="px-3 py-3 sm:px-4">
                <dt className="text-xs font-medium text-tertiary">{s.label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-primary tabular-nums sm:text-md">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-secondary">Today’s portion</p>
              <span className="text-sm text-tertiary tabular-nums">
                {Math.min(status.todayCount, status.daily)} / {status.daily}
              </span>
            </div>
            <ProgressBarBase value={Math.min(status.todayCount, status.daily)} max={status.daily} />
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-secondary">Overall pace</p>
              <Badge type="pill-color" color={status.ahead >= 0 ? "success" : "warning"} size="sm">
                {status.ahead >= 0 ? `On track · ${ayatCount(status.ahead)} ahead` : `${ayatCount(-status.ahead)} behind`}
              </Badge>
            </div>
            <div className="relative">
              <ProgressBarBase value={status.done} max={TOTAL_AYAT} />
              <span
                aria-hidden="true"
                className="absolute -top-1 h-4 w-0.5 rounded-full bg-fg-secondary"
                style={{ left: `calc(${pct(status.expected, TOTAL_AYAT)}% - 1px)` }}
              />
            </div>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tertiary">
              <span>Read: {status.done.toLocaleString("en-US")}</span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-3 w-0.5 rounded-full bg-fg-secondary" /> Target by today: {status.expected.toLocaleString("en-US")}
              </span>
            </p>
          </div>

          <Button href={lastRead ? `/surah/${lastRead.surah}#v-${lastRead.ayah}` : "/surah/1"} iconLeading={BookOpen01}>
            Read today’s portion
          </Button>
        </div>
      ) : plan ? null : (
        <div className="space-y-5">
          <AriaRadioGroup aria-label="Plan length" value={choice} onChange={setChoice} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLANS.map((p) => (
              <AriaRadio
                key={p.days}
                value={String(p.days)}
                className={({ isSelected, isFocusVisible }) =>
                  cx(
                    "flex cursor-pointer items-start justify-between gap-2 rounded-xl bg-primary p-4 ring-1 ring-secondary transition outline-focus-ring ring-inset hover:bg-primary_hover",
                    isSelected && "bg-brand-primary_alt ring-2 ring-brand hover:bg-brand-primary_alt",
                    isFocusVisible && "outline-2 outline-offset-2",
                  )
                }
              >
                {({ isSelected }) => (
                  <>
                    <span>
                      <span className={cx("block text-sm font-semibold", isSelected ? "text-brand-secondary" : "text-secondary")}>{p.label}</span>
                      <span className="mt-0.5 block text-sm text-tertiary">{ayatCount(Math.ceil(TOTAL_AYAT / p.days))} a day</span>
                    </span>
                    <RadioButtonBase size="sm" isSelected={isSelected} />
                  </>
                )}
              </AriaRadio>
            ))}
          </AriaRadioGroup>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-tertiary">
              About <strong className="font-semibold text-secondary">{Math.max(1, Math.round(Math.ceil(TOTAL_AYAT / Number(choice)) / 2))} minutes</strong> of
              reading a day.
            </p>
            <Button iconLeading={Target04} onPress={() => startPlan(Number(choice))}>
              Start plan
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SurahsInProgress({ chapters, read }: { chapters: Chapter[]; read: LibraryState["read"] }) {
  const started = chapters
    .map((c) => ({ c, n: read[c.id]?.length ?? 0 }))
    .filter((x) => x.n > 0 && x.n < x.c.versesCount)
    .sort((a, b) => b.n / b.c.versesCount - a.n / a.c.versesCount)
    .slice(0, 6);
  const done = chapters.filter((c) => (read[c.id]?.length ?? 0) >= c.versesCount);
  if (!started.length && !done.length) return null;
  const firstUnread = (id: number, total: number) => {
    const seen = new Set(read[id]);
    for (let a = 1; a <= total; a++) if (!seen.has(a)) return a;
    return 1;
  };
  return (
    <Card id="surahs-title" title="Surahs" description="Pick up any surah where you stopped." icon={BookOpen01} bodyClassName="p-0 md:p-0">
      {started.length > 0 && (
        <ul className="divide-y divide-secondary">
          {started.map(({ c, n }) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 md:px-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary tabular-nums ring-1 ring-secondary">
                {c.id}
              </span>
              <div className="min-w-0 flex-1 sm:max-w-56">
                <p className="truncate text-sm font-semibold text-primary">{c.nameSimple}</p>
                <p className="text-sm text-tertiary">
                  {n} of {ayatCount(c.versesCount)}
                </p>
              </div>
              <span lang="ar" dir="rtl" className="hidden font-quran text-xl text-secondary sm:block">
                {c.nameArabic}
              </span>
              <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
                <ProgressBar value={n} max={c.versesCount} labelPosition="right" />
              </div>
              <Button size="sm" color="secondary" href={`/surah/${c.id}#v-${firstUnread(c.id, c.versesCount)}`} iconTrailing={ArrowRight}>
                Resume
              </Button>
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <div className={cx("flex flex-wrap items-center gap-2 px-5 py-4 md:px-6", started.length > 0 && "border-t border-secondary")}>
          <span className="mr-1 flex items-center gap-1.5 text-sm font-medium text-secondary">
            <CheckVerified01 aria-hidden="true" className="size-4 text-fg-success-secondary" />
            Read in full
          </span>
          {done.map((c) => (
            <Link key={c.id} href={`/surah/${c.id}`} prefetch={false} className="rounded-full outline-focus-ring focus-visible:outline-2">
              <Badge type="pill-color" color="success" size="sm">
                {c.nameSimple}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function ProgressTab({ chapters }: { chapters: Chapter[] }) {
  const read = useLibrary((s) => s.read);
  const log = useLibrary((s) => s.log);
  const plan = useLibrary((s) => s.plan);
  const lastRead = useLibrary((s) => s.lastRead);
  const memorisedCount = useLibrary((s) => s.memorised.length);
  const due = useLibrary((s) => dueReviews(s).length);
  const mounted = useMounted();
  const done = totalRead(read);
  const empty = done === 0 && memorisedCount === 0 && !plan;

  if (empty)
    return (
      <div className="space-y-6">
        <EmptyState size="md" className="max-w-none overflow-hidden rounded-2xl bg-primary py-12 shadow-xs ring-1 ring-secondary">
          <EmptyState.Header pattern="circle">
            <EmptyState.FeaturedIcon icon={BookOpen01} color="brand" theme="light" />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title>Your progress will appear here</EmptyState.Title>
            <EmptyState.Description>
              Read a surah and Mishkah counts the ayat you read, your daily streak and how much of the Qurʾān you have completed. It all stays on this device.
            </EmptyState.Description>
          </EmptyState.Content>
          <EmptyState.Footer>
            <Button href={lastRead ? `/surah/${lastRead.surah}#v-${lastRead.ayah}` : "/surah/1"} iconLeading={BookOpen01}>
              Start reading
            </Button>
          </EmptyState.Footer>
        </EmptyState>
        <div className="grid gap-6 lg:grid-cols-3">
          <PlanCard />
          <OfflineCard />
        </div>
      </div>
    );

  const week = mounted ? sumDays(log, 7) : 0;
  const prevWeek = mounted ? sumDays(log, 7, 7) : 0;
  const days = mounted ? streak(log) : 0;
  const best = bestStreak(log);
  const p = pct(done, TOTAL_AYAT);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric icon={TrendUp01} label="Qurʾān read" value={fmtPct(p)} hint={`${done.toLocaleString("en-US")} of ${TOTAL_AYAT.toLocaleString("en-US")} ayat`}>
          <ProgressBarBase value={done} max={TOTAL_AYAT} />
        </Metric>
        <Metric
          icon={Calendar}
          label="This week"
          value={week.toLocaleString("en-US")}
          trend={prevWeek ? pct(week - prevWeek, prevWeek) : null}
          hint={prevWeek ? "ayat, vs the week before" : "ayat in the last 7 days"}
        />
        <Metric
          icon={Zap}
          label="Day streak"
          value={days}
          hint={best > days ? `Best: ${best} days` : days ? "Your best yet. Keep it going today" : "Read an ayah to start one"}
        />
        <Metric
          icon={Trophy01}
          label="Memorised"
          value={memorisedCount}
          hint={memorisedCount ? (due ? `${ayatCount(due)} due for review` : "All reviews done today") : "Mark ayat in Memorise mode"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ActivityCard log={log} />
        <KhatmCard chapters={chapters} read={read} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PlanCard />
        <OfflineCard />
      </div>

      <SurahsInProgress chapters={chapters} read={read} />
    </div>
  );
}

/* Notes tab ------------------------------------------------------------------------------------- */

function NotesTab({ chapters }: { chapters: Chapter[] }) {
  const notes = useLibrary((s) => s.notes);
  const [query, setQuery] = useState("");
  const entries = Object.entries(notes).sort((a, b) => b[1].at - a[1].at);
  if (!entries.length)
    return (
      <EmptyState size="md" className="max-w-none rounded-2xl bg-primary py-14 shadow-xs ring-1 ring-secondary">
        <EmptyState.Header pattern="circle">
          <EmptyState.FeaturedIcon icon={Edit05} color="brand" theme="light" />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>No notes yet</EmptyState.Title>
          <EmptyState.Description>Open the ⋯ menu beside any ayah and choose “Add note” to keep a reflection.</EmptyState.Description>
        </EmptyState.Content>
      </EmptyState>
    );
  const q = query.trim().toLowerCase();
  const shown = q
    ? entries.filter(
        ([key, n]) => n.text.toLowerCase().includes(q) || key.includes(q) || chapters[Number(key.split(":")[0]) - 1]?.nameSimple.toLowerCase().includes(q),
      )
    : entries;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tertiary">
          {entries.length} {entries.length === 1 ? "note" : "notes"}, newest first
        </p>
        <Input size="sm" icon={SearchLg} placeholder="Search notes" value={query} onChange={setQuery} className="w-full sm:w-72" />
      </div>
      {shown.length === 0 ? (
        <p className="rounded-2xl bg-primary px-6 py-10 text-center text-sm text-tertiary ring-1 ring-secondary">No notes match “{query}”.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {shown.map(([key, note]) => {
            const [s, a] = key.split(":").map(Number);
            const ch = chapters[s - 1];
            return (
              <li key={key} className="flex flex-col rounded-2xl bg-primary shadow-xs ring-1 ring-secondary">
                <div className="flex items-center justify-between gap-3 border-b border-secondary px-5 py-3">
                  <Link
                    href={`/surah/${s}#v-${a}`}
                    prefetch={false}
                    className="flex min-w-0 items-center gap-2 rounded-md outline-focus-ring focus-visible:outline-2"
                  >
                    <Badge type="pill-color" color="brand" size="sm" className="tabular-nums">
                      {key}
                    </Badge>
                    <span className="truncate text-sm font-semibold text-primary hover:underline">{ch?.nameSimple}</span>
                  </Link>
                  <span className="shrink-0 text-xs text-quaternary">
                    {new Date(note.at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="flex-1 border-l-2 border-gold-300 mx-5 my-4 pl-4 text-sm leading-relaxed whitespace-pre-line text-secondary dark:border-gold-500/60">
                  {note.text}
                </p>
                <div className="flex items-center justify-between gap-2 px-5 pb-4">
                  <Button size="sm" color="link-color" href={`/surah/${s}#v-${a}`} iconTrailing={ArrowRight}>
                    Open ayah
                  </Button>
                  <ButtonUtility size="xs" color="tertiary" tooltip="Delete note" icon={Trash01} onPress={() => saveNote(s, a, "")} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* Memorised tab --------------------------------------------------------------------------------- */

function MemorisedTab({ chapters }: { chapters: Chapter[] }) {
  const memorised = useLibrary((s) => s.memorised);
  const due = useLibrary((s) => dueReviews(s).length);
  const next = useLibrary((s) => nextReviewDate(s));
  const mounted = useMounted();
  if (!memorised.length)
    return (
      <EmptyState size="md" className="max-w-none rounded-2xl bg-primary py-14 shadow-xs ring-1 ring-secondary">
        <EmptyState.Header pattern="circle">
          <EmptyState.FeaturedIcon icon={CheckCircle} color="success" theme="light" />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>Nothing memorised yet</EmptyState.Title>
          <EmptyState.Description>Switch a surah to Memorise mode, recite with the words hidden, and mark ayat as you learn them.</EmptyState.Description>
        </EmptyState.Content>
        <EmptyState.Footer>
          <Button href="/surah/1">Start with Al-Fatihah</Button>
        </EmptyState.Footer>
      </EmptyState>
    );
  const bySurah = new Map<number, number[]>();
  for (const k of memorised) {
    const [s, a] = k.split(":").map(Number);
    bySurah.set(
      s,
      [...(bySurah.get(s) ?? []), a].sort((x, y) => x - y),
    );
  }
  const isDue = mounted && due > 0;
  return (
    <div className="space-y-6">
      <section
        aria-label="Review"
        className={cx(
          "flex flex-col gap-5 rounded-2xl p-5 shadow-xs ring-1 sm:flex-row sm:items-center md:p-6",
          isDue ? "bg-brand-primary_alt ring-brand" : "bg-primary ring-secondary",
        )}
      >
        <FeaturedIcon icon={isDue ? RefreshCw01 : CheckCircle} color={isDue ? "brand" : "success"} theme="light" size="lg" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-primary">{isDue ? `${ayatCount(due)} due for review` : "All reviews done for today"}</h2>
          <p className="mt-0.5 text-sm text-tertiary">
            {ayatCount(memorised.length)} memorised across {bySurah.size} {bySurah.size === 1 ? "surah" : "surahs"}. They come back at growing intervals (spaced
            repetition) so they stay firm.
            {mounted && !isDue && next ? ` Next review: ${fmtDate(next, { weekday: "long", day: "numeric", month: "short" })}.` : ""}
          </p>
        </div>
        <Button href="/review" color={isDue ? "primary" : "secondary"} iconTrailing={ArrowRight} className="self-start sm:self-center">
          {isDue ? "Start review" : "Open review"}
        </Button>
      </section>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...bySurah.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([s, ayat]) => {
            const ch = chapters[s - 1];
            const complete = ayat.length >= ch.versesCount;
            return (
              <li key={s} className="flex flex-col gap-4 rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/surah/${s}`}
                    prefetch={false}
                    className="group flex min-w-0 items-center gap-3 rounded-lg outline-focus-ring focus-visible:outline-2"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary tabular-nums ring-1 ring-secondary">
                      {s}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-primary group-hover:underline">{ch.nameSimple}</span>
                      <span className="block text-sm text-tertiary">
                        {ayat.length} of {ayatCount(ch.versesCount)}
                      </span>
                    </span>
                  </Link>
                  <span lang="ar" dir="rtl" className="font-quran text-xl text-secondary">
                    {ch.nameArabic}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressBarBase value={ayat.length} max={ch.versesCount} className="flex-1" />
                  {complete ? (
                    <Badge type="pill-color" color="success" size="sm">
                      Complete
                    </Badge>
                  ) : (
                    <span className="text-sm font-medium text-secondary tabular-nums">{fmtPct(pct(ayat.length, ch.versesCount))}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ayat.map((a) => (
                    <BadgeWithButton
                      key={a}
                      type="pill-color"
                      color="success"
                      size="sm"
                      buttonLabel={`Unmark ${s}:${a} as memorised`}
                      onButtonClick={() => toggleMemorised(s, a)}
                    >
                      <span className="tabular-nums">{a}</span>
                    </BadgeWithButton>
                  ))}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

/* View ------------------------------------------------------------------------------------------ */

export function LibraryView({ chapters, defaultTab = "progress" }: { chapters: Chapter[]; defaultTab?: LibraryTab }) {
  const counts = {
    b: useLibrary((s) => s.bookmarks.length),
    n: useLibrary((s) => Object.keys(s.notes).length),
    m: useLibrary((s) => s.memorised.length),
  };
  return (
    <>
      <LibraryHeader />
      <ContinueCard chapters={chapters} />
      <Tabs defaultSelectedKey={defaultTab} className="mt-8">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          <Tabs.List
            type="button-border"
            size="sm"
            aria-label="Library sections"
            className="w-max min-w-full sm:min-w-0"
            items={[
              { id: "progress", label: "Progress", icon: BarChartSquare02 },
              { id: "bookmarks", label: "Bookmarks", icon: Bookmark, badge: counts.b || undefined },
              { id: "notes", label: "Notes", icon: Edit05, badge: counts.n || undefined },
              { id: "memorised", label: "Memorised", icon: CheckVerified01, badge: counts.m || undefined },
            ]}
          />
        </div>
        <Tabs.Panel id="progress" className="pt-6 outline-hidden">
          <ProgressTab chapters={chapters} />
        </Tabs.Panel>
        <Tabs.Panel id="bookmarks" className="pt-6 outline-hidden">
          <BookmarkList chapters={chapters} />
        </Tabs.Panel>
        <Tabs.Panel id="notes" className="pt-6 outline-hidden">
          <NotesTab chapters={chapters} />
        </Tabs.Panel>
        <Tabs.Panel id="memorised" className="pt-6 outline-hidden">
          <MemorisedTab chapters={chapters} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
