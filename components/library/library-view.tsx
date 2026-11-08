"use client";

import { ArrowRight, BookOpen01, CheckCircle, RefreshCw01, Edit05, Flag05, Target04, Trash01, TrendUp01, Zap } from "@untitledui/icons";
import { motion } from "motion/react";
import Link from "next/link";
import { type FC, useState } from "react";
import { Alert } from "@/components/application/alerts/alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Tabs } from "@/components/application/tabs/tabs";
import { Badge, BadgeWithButton } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ProgressBarCircle } from "@/components/base/progress-indicators/progress-circles";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { BookmarkList } from "@/components/quran/bookmark-list";
import { OfflineCard } from "@/components/library/offline-card";
import { TOTAL_AYAT } from "@/lib/constants";
import { dueReviews, planStatus, saveNote, startPlan, stopPlan, streak, today, toggleMemorised, totalRead, useLibrary } from "@/lib/library";
import type { Chapter } from "@/lib/types";
import { cx } from "@/utils/cx";

export type LibraryTab = "progress" | "bookmarks" | "notes" | "memorised";

const PLANS = [
  { days: 7, label: "1 week" },
  { days: 30, label: "30 days" },
  { days: 60, label: "2 months" },
  { days: 365, label: "1 year" },
];

function Stat({ icon, label, value, hint }: { icon: FC<{ className?: string }>; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-secondary bg-primary p-5 shadow-xs">
      <FeaturedIcon icon={icon} color="brand" theme="light" size="md" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-tertiary">{label}</p>
        <p className="mt-1 font-display text-display-xs font-medium text-primary tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-quaternary">{hint}</p>}
      </div>
    </div>
  );
}

function Activity({ log }: { log: Record<string, number> }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = today(d);
    return { key, count: log[key] ?? 0, label: d.toLocaleDateString("en", { weekday: "narrow" }) };
  });
  const max = Math.max(10, ...days.map((d) => d.count));
  return (
    <div className="rounded-2xl border border-secondary bg-primary p-5 shadow-xs">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-primary">Last 14 days</h3>
        <span className="text-xs text-tertiary">ayat read per day</span>
      </div>
      <div className="mt-4 flex h-28 items-end gap-1.5" role="img" aria-label={`Ayat read per day: ${days.map((d) => d.count).join(", ")}`}>
        {days.map((d, i) => (
          <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <motion.span
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              transition={{ delay: i * 0.03, duration: 0.5 }}
              title={`${d.key}: ${d.count} ayat`}
              className={cx("w-full rounded-md", d.count ? "bg-brand-solid" : "bg-quaternary", d.key === today() && "ring-2 ring-gold-400 ring-offset-1 ring-offset-bg-primary")}
            />
            <span className="text-[10px] text-quaternary">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressTab({ chapters }: { chapters: Chapter[] }) {
  const read = useLibrary((s) => s.read);
  const log = useLibrary((s) => s.log);
  const plan = useLibrary((s) => s.plan);
  const lastRead = useLibrary((s) => s.lastRead);
  const memorisedCount = useLibrary((s) => s.memorised.length);
  const [choice, setChoice] = useState(30);
  const done = totalRead(read);
  const days = streak(log);
  const status = plan ? planStatus(plan, { read, log }) : null;
  const surahsDone = chapters.filter((c) => (read[c.id]?.length ?? 0) >= c.versesCount).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={BookOpen01} label="Ayat read" value={done.toLocaleString("en-US")} hint={`of ${TOTAL_AYAT.toLocaleString("en-US")} · ${surahsDone} ${surahsDone === 1 ? "surah" : "surahs"} complete`} />
        <Stat icon={Zap} label="Day streak" value={String(days)} hint={days ? "Keep it going today" : "Read an ayah to start"} />
        <Stat icon={TrendUp01} label="Today" value={String(log[today()] ?? 0)} hint="ayat read" />
        <Stat icon={CheckCircle} label="Memorised" value={String(memorisedCount)} hint="ayat" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="plan-title" className="rounded-2xl border border-secondary bg-primary p-6 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="plan-title" className="font-display text-xl font-medium text-primary">
                Reading plan
              </h3>
              <p className="mt-1 text-sm text-tertiary">Complete the whole Qurʾān (a khatm) at a steady daily pace.</p>
            </div>
            <FeaturedIcon icon={Target04} color="brand" theme="light" size="md" />
          </div>

          {plan && status ? (
            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge type="pill-color" color="brand" size="md">
                  Day {status.day} of {plan.days}
                </Badge>
                <Badge type="pill-color" color={status.ahead >= 0 ? "success" : "warning"} size="md">
                  {status.ahead >= 0 ? `On track · ${status.ahead} ahead` : `${-status.ahead} ayat behind`}
                </Badge>
              </div>
              <div>
                <p className="mb-2 flex justify-between text-sm font-medium text-secondary">
                  Today’s goal
                  <span className="text-tertiary tabular-nums">
                    {status.todayCount} / {status.daily} ayat
                  </span>
                </p>
                <ProgressBar value={Math.min(status.todayCount, status.daily)} max={status.daily} />
              </div>
              <div>
                <p className="mb-2 flex justify-between text-sm font-medium text-secondary">
                  Overall
                  <span className="text-tertiary tabular-nums">
                    {done} / {TOTAL_AYAT}
                  </span>
                </p>
                <ProgressBar value={done} max={TOTAL_AYAT} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button href={lastRead ? `/surah/${lastRead.surah}#v-${lastRead.ayah}` : "/surah/1"} iconLeading={BookOpen01}>
                  Read today’s portion
                </Button>
                <Button color="tertiary" iconLeading={Flag05} onPress={stopPlan}>
                  End plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <ButtonGroup size="md" selectedKeys={[String(choice)]} disallowEmptySelection onSelectionChange={(k) => setChoice(Number([...k][0]))} aria-label="Plan length">
                {PLANS.map((p) => (
                  <ButtonGroupItem key={p.days} id={String(p.days)}>
                    {p.label}
                  </ButtonGroupItem>
                ))}
              </ButtonGroup>
              <p className="text-sm text-tertiary">
                That’s about <strong className="text-secondary">{Math.ceil(TOTAL_AYAT / choice)} ayat a day</strong>, roughly{" "}
                {Math.max(1, Math.round(Math.ceil(TOTAL_AYAT / choice) / 2))} minutes of reading.
              </p>
              <Button iconLeading={Target04} onPress={() => startPlan(choice)}>
                Start plan
              </Button>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <div className="flex items-center justify-center rounded-2xl border border-secondary bg-primary p-6 shadow-xs">
            <ProgressBarCircle size="xs" value={done} max={TOTAL_AYAT} label="Qurʾān read" valueFormatter={(v, pct) => (v > 0 && pct < 1 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`)} />
          </div>
          <Activity log={log} />
        </div>
      </div>
      <OfflineCard />
    </div>
  );
}

function NotesTab({ chapters }: { chapters: Chapter[] }) {
  const notes = useLibrary((s) => s.notes);
  const entries = Object.entries(notes).sort((a, b) => b[1].at - a[1].at);
  if (!entries.length)
    return (
      <EmptyState size="md" className="py-14">
        <EmptyState.Header pattern="circle">
          <EmptyState.FeaturedIcon icon={Edit05} color="brand" theme="light" />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>No notes yet</EmptyState.Title>
          <EmptyState.Description>Open the ⋯ menu beside any ayah and choose “Add note” to keep a reflection.</EmptyState.Description>
        </EmptyState.Content>
      </EmptyState>
    );
  return (
    <ul className="space-y-3">
      {entries.map(([key, note]) => {
        const [s, a] = key.split(":").map(Number);
        const ch = chapters[s - 1];
        return (
          <li key={key} className="rounded-2xl border border-secondary bg-primary p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/surah/${s}#v-${a}`} className="flex items-center gap-2 rounded-md outline-focus-ring focus-visible:outline-2">
                <Badge type="pill-color" color="brand" size="md" className="font-display tabular-nums">
                  {key}
                </Badge>
                <span className="font-semibold text-primary hover:underline">{ch?.nameSimple}</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-quaternary">{new Date(note.at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</span>
                <ButtonUtility size="xs" color="tertiary" tooltip="Delete note" icon={Trash01} onPress={() => saveNote(s, a, "")} />
              </div>
            </div>
            <p className="mt-3 text-sm whitespace-pre-line text-secondary">{note.text}</p>
          </li>
        );
      })}
    </ul>
  );
}

function MemorisedTab({ chapters }: { chapters: Chapter[] }) {
  const memorised = useLibrary((s) => s.memorised);
  const due = useLibrary((s) => dueReviews(s).length);
  if (!memorised.length)
    return (
      <EmptyState size="md" className="py-14">
        <EmptyState.Header pattern="circle">
          <EmptyState.FeaturedIcon icon={CheckCircle} color="success" theme="light" />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>Nothing memorised yet</EmptyState.Title>
          <EmptyState.Description>Switch a surah to Memorise mode, recite with the words hidden, and mark ayat as you learn them.</EmptyState.Description>
        </EmptyState.Content>
        <EmptyState.Footer>
          <Button href="/surah/1">Start with Al-Fātiḥah</Button>
        </EmptyState.Footer>
      </EmptyState>
    );
  const bySurah = new Map<number, number[]>();
  for (const k of memorised) {
    const [s, a] = k.split(":").map(Number);
    bySurah.set(s, [...(bySurah.get(s) ?? []), a].sort((x, y) => x - y));
  }
  return (
    <div className="space-y-4">
      <Alert
        color={due > 0 ? "brand" : "success"}
        icon={due > 0 ? RefreshCw01 : CheckCircle}
        title={due > 0 ? `${due} ayah${due === 1 ? "" : "s"} due for review` : "All reviews done for today"}
        description="Memorised ayat return at growing intervals (spaced repetition) so they stay firm."
        actions={
          <Button size="sm" color="link-color" href="/review" iconTrailing={ArrowRight}>
            {due > 0 ? "Start review" : "Open review"}
          </Button>
        }
      />
    <ul className="grid gap-3 sm:grid-cols-2">
      {[...bySurah.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([s, ayat]) => {
          const ch = chapters[s - 1];
          return (
            <li key={s} className="rounded-2xl border border-secondary bg-primary p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/surah/${s}`} className="font-semibold text-primary hover:underline">
                  {s}. {ch.nameSimple}
                </Link>
                <span lang="ar" dir="rtl" className="font-quran text-xl text-secondary">
                  {ch.nameArabic}
                </span>
              </div>
              <ProgressBar value={ayat.length} max={ch.versesCount} labelPosition="right" className="mt-3" />
              <div className="mt-3 flex flex-wrap gap-1">
                {ayat.map((a) => (
                  <BadgeWithButton
                    key={a}
                    type="pill-color"
                    color="success"
                    size="sm"
                    buttonLabel={`Unmark ayah ${a} as memorised`}
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

export function LibraryView({ chapters, defaultTab = "progress" }: { chapters: Chapter[]; defaultTab?: LibraryTab }) {
  const counts = {
    b: useLibrary((s) => s.bookmarks.length),
    n: useLibrary((s) => Object.keys(s.notes).length),
    m: useLibrary((s) => s.memorised.length),
  };
  return (
    <Tabs defaultSelectedKey={defaultTab} className="mt-8">
      <Tabs.List
        type="underline"
        size="md"
        aria-label="Library sections"
        className="overflow-x-auto"
        items={[
          { id: "progress", label: "Progress" },
          { id: "bookmarks", label: "Bookmarks", badge: counts.b || undefined },
          { id: "notes", label: "Notes", badge: counts.n || undefined },
          { id: "memorised", label: "Memorised", badge: counts.m || undefined },
        ]}
      />
      <Tabs.Panel id="progress" className="pt-8">
        <ProgressTab chapters={chapters} />
      </Tabs.Panel>
      <Tabs.Panel id="bookmarks" className="pt-2">
        <BookmarkList chapters={chapters} />
      </Tabs.Panel>
      <Tabs.Panel id="notes" className="pt-8">
        <NotesTab chapters={chapters} />
      </Tabs.Panel>
      <Tabs.Panel id="memorised" className="pt-8">
        <MemorisedTab chapters={chapters} />
      </Tabs.Panel>
    </Tabs>
  );
}
