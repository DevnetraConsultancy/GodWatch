"use client";

import * as React from "react";
import { Flame, Target, Trophy } from "lucide-react";
import type { StatusMap, SummaryDTO, TaskDTO } from "@/types/dto";
import { addDays, formatDate, type ISODate } from "@/lib/dates";

const BAR_DAYS = 14;
const HEAT_WEEKS = 12;

/** Share of active habits completed on each of the last `count` days (null = no habit active). */
function dayRates(tasks: TaskDTO[], statuses: StatusMap, today: ISODate, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(today, i - (count - 1));
    let active = 0;
    let done = 0;
    for (const t of tasks) {
      if (t.startDate > date) continue;
      active += 1;
      if (statuses[t.id]?.[date] === "COMPLETED") done += 1;
    }
    return { date, rate: active > 0 ? done / active : null };
  });
}

function ProgressRing({ value }: { value: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" className="size-11 -rotate-90" aria-hidden>
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] leading-tight text-fg-muted">
        <Icon className="size-3 text-accent-text" aria-hidden />
        {label}
      </dt>
      <dd className="font-display text-base font-semibold leading-tight tracking-tight sm:text-lg">{value}</dd>
    </div>
  );
}

/** Last two weeks as tiny bars, today rightmost. */
function MiniBars({ days }: { days: { date: ISODate; rate: number | null }[] }) {
  return (
    <div
      className="flex h-9 items-end gap-[3px]"
      role="img"
      aria-label={`Completion over the last ${days.length} days`}
    >
      {days.map((d) => (
        <span
          key={d.date}
          title={`${formatDate(d.date, { weekday: "short", month: "short", day: "numeric" })}: ${
            d.rate === null ? "no habits yet" : `${Math.round(d.rate * 100)}%`
          }`}
          className="w-[5px]"
          style={{
            height: d.rate ? `${Math.max(14, d.rate * 100)}%` : "3px",
            opacity: d.rate === null ? 0.4 : 1,
            // Gold marks a perfect day; partial days stay neutral so gold never dims into brown.
            background: d.rate === 1 ? "var(--accent)" : d.rate ? "var(--fg-subtle)" : "var(--line)",
          }}
        />
      ))}
    </div>
  );
}

/** Last twelve weeks as a one-glance heat chip; columns are weeks, rows are days. */
function HeatChip({ days }: { days: { date: ISODate; rate: number | null }[] }) {
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return (
    <div className="flex gap-px" role="img" aria-label={`Completion heatmap of the last ${HEAT_WEEKS} weeks`}>
      {weeks.map((week, i) => (
        <div key={i} className="flex flex-col gap-px">
          {week.map((d) => (
            <span
              key={d.date}
              title={`${formatDate(d.date, { month: "short", day: "numeric" })}: ${
                d.rate === null ? "no habits yet" : `${Math.round(d.rate * 100)}%`
              }`}
              className="size-[4px] rounded-none"
              style={{
                // Perfect days glow gold at full strength; the rest scale in neutral grey.
                background: d.rate === 1 ? "var(--accent)" : d.rate ? "var(--fg)" : "var(--line)",
                opacity: d.rate === 1 ? 1 : d.rate ? 0.2 + d.rate * 0.45 : 1,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The whole day-at-a-glance in one slim ribbon: today's ring, streaks,
 * lifetime, a two-week bar sparkline and a twelve-week heat chip.
 */
export function SummaryBar({
  heading,
  summary,
  todayDone,
  todayActive,
  tasks,
  statuses,
  today,
}: {
  heading?: React.ReactNode;
  summary: SummaryDTO;
  todayDone: number;
  todayActive: number;
  tasks: TaskDTO[];
  statuses: StatusMap;
  today: ISODate;
}) {
  const rate = todayActive > 0 ? Math.round((todayDone / todayActive) * 100) : 0;
  const series = React.useMemo(
    () => dayRates(tasks, statuses, today, HEAT_WEEKS * 7),
    [tasks, statuses, today]
  );

  return (
    <div className="flex min-w-0 grow flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-start sm:gap-5">
        {heading}
        <div className="flex items-center gap-2.5" aria-live="polite">
          <div className="relative shrink-0">
            <ProgressRing value={rate} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums">
              {rate}%
            </span>
          </div>
          <p className="whitespace-nowrap font-display text-base font-semibold tracking-tight sm:text-lg">
            {todayDone} of {todayActive} done
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-start">
        <dl className="flex items-center gap-4 sm:gap-5">
          <Stat icon={Flame} label="Streak" value={`${summary.currentStreak}d`} />
          <Stat icon={Trophy} label="Best" value={`${summary.longestStreak}d`} />
          <Stat icon={Target} label="Lifetime" value={`${summary.lifetimeCompletion}%`} />
        </dl>
        <div className="sm:hidden">
          <HeatChip days={series.slice(-8 * 7)} />
        </div>
      </div>

      <div className="hidden items-center gap-4 sm:flex">
        <MiniBars days={series.slice(-BAR_DAYS)} />
        <div className="hidden lg:block">
          <HeatChip days={series} />
        </div>
      </div>
    </div>
  );
}
