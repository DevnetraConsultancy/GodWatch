"use client";

import * as React from "react";
import { Check, Flame, Minus, StickyNote, Target, Trophy, X } from "lucide-react";
import { STATUS_LABELS, nextStatus, type StatusValue } from "@/lib/status";
import { cn } from "@/lib/utils";

/*
 * A live miniature of the dashboard ("Today" page): the same summary ribbon,
 * the same habit headers and the same cells. Clicking a cell cycles its state
 * exactly as it does in the app, but nothing here is saved.
 */

// `time` is the habit's window for today, shown under its name as on the dashboard.
const HABITS = [
  { name: "Deep work", color: "#6366f1", time: "9 AM - 11 AM" },
  { name: "Workout", color: "#f97316", time: "6 PM - 7 PM" },
  { name: "Read 20 pages", color: "#10b981", time: "9 PM - 9:30 PM" },
  { name: "Meditate", color: "#ec4899", time: null },
];

const DAYS: { label: string; marks: StatusValue[]; today?: boolean; note?: boolean }[] = [
  { label: "Thu, Mar 13", marks: ["COMPLETED", "PENDING", "COMPLETED", "PENDING"], today: true },
  { label: "Wed, Mar 12", marks: ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED"], note: true },
  { label: "Tue, Mar 11", marks: ["COMPLETED", "FAILED", "COMPLETED", "COMPLETED"] },
  { label: "Mon, Mar 10", marks: ["COMPLETED", "COMPLETED", "MISSED", "COMPLETED"], note: true },
  { label: "Sun, Mar 9", marks: ["COMPLETED", "COMPLETED", "COMPLETED", "FAILED"] },
];

/** Two weeks of completion rates for the sparkline, today rightmost. */
const BARS = [1, 0.75, 1, 1, 0.5, 1, 0.75, 1, 0.25, 1, 1, 0.75, 1, 0.5];

// Mirrors StatusCell in the dashboard.
const STYLE: Record<StatusValue, string> = {
  PENDING: "text-fg-subtle hover:bg-glass-hover",
  COMPLETED: "bg-success-soft text-success hover:brightness-110",
  FAILED: "bg-danger-soft text-danger hover:brightness-110",
  MISSED: "bg-warning-soft text-warning hover:brightness-110",
};
const ICON: Record<StatusValue, React.ReactNode> = {
  PENDING: <span className="size-1.5 rounded-full bg-current opacity-60" />,
  COMPLETED: <Check className="size-[18px]" strokeWidth={2.5} />,
  FAILED: <X className="size-[18px]" strokeWidth={2.5} />,
  MISSED: <Minus className="size-[18px]" strokeWidth={2.5} />,
};

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
      <dd className="font-display text-base font-semibold leading-tight tracking-tight">{value}</dd>
    </div>
  );
}

/** Interactive illustration of the dashboard grid (example data, never saved). */
export function ProductPreview({ className }: { className?: string }) {
  const [marks, setMarks] = React.useState(() => DAYS.map((d) => d.marks));
  const [last, setLast] = React.useState<string | null>(null);

  const todayDone = marks[0]!.filter((m) => m === "COMPLETED").length;
  const rate = Math.round((todayDone / HABITS.length) * 100);

  const cycle = (row: number, col: number) => {
    const to = nextStatus(marks[row]![col]!);
    setMarks((prev) => prev.map((r, i) => (i === row ? r.map((m, j) => (j === col ? to : m)) : r)));
    setLast(`${HABITS[col]!.name}: ${STATUS_LABELS[to]}`);
  };

  return (
    <figure className={cn("glass-strong overflow-hidden rounded-xl", className)} aria-label="Example of the GodWatch dashboard">
      {/* Summary ribbon, as on the Today page. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-3">
        <div className="leading-tight">
          <p className="font-display text-base font-semibold tracking-tight">Today</p>
          <p className="whitespace-nowrap text-[11px] text-fg-muted">Thursday, March 13</p>
        </div>
        <div className="flex items-center gap-2.5" aria-live="polite">
          <div className="relative shrink-0">
            <ProgressRing value={rate} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums">{rate}%</span>
          </div>
          <p className="whitespace-nowrap font-display text-base font-semibold tracking-tight">
            {todayDone} of {HABITS.length} done
          </p>
        </div>
        <dl className="flex items-center gap-4">
          <Stat icon={Flame} label="Streak" value="12d" />
          <Stat icon={Trophy} label="Best" value="31d" />
          <Stat icon={Target} label="Lifetime" value="86%" />
        </dl>
        <div className="ml-auto hidden h-9 items-end gap-[3px] sm:flex" role="img" aria-label="Completion over the last 14 days">
          {BARS.map((r, i) => (
            <span
              key={i}
              className="w-[5px]"
              style={{ height: `${Math.max(14, r * 100)}%`, background: r === 1 ? "var(--accent)" : "var(--fg-subtle)" }}
            />
          ))}
        </div>
      </div>

      {/* The grid: rows are days, newest first; columns are habits. */}
      <div className="scrollbar-thin overflow-x-auto" tabIndex={0} role="region" aria-label="Example grid, scrolls sideways">
        <table className="w-full min-w-[520px] border-separate border-spacing-0" role="grid">
          <thead>
            <tr>
              <th scope="col" className="w-32 px-3 text-left text-xs font-medium text-fg-muted">
                Day
              </th>
              {HABITS.map((h) => (
                <th key={h.name} scope="col" className="min-w-32 px-1 py-2 align-bottom text-xs font-semibold">
                  <span className="flex min-h-10 items-center justify-center gap-1.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: h.color }} aria-hidden />
                    <span className="flex min-w-0 flex-col text-left">
                      <span className="leading-tight">{h.name}</span>
                      {h.time && (
                        <span className="whitespace-nowrap text-[10px] font-normal leading-tight text-fg-subtle">{h.time}</span>
                      )}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d, row) => (
              <tr key={d.label} className={cn(d.today && "[&>td]:bg-accent-soft/60 [&>th]:bg-accent-soft")}>
                <th scope="row" className={cn("border-r border-line px-3 text-left", d.today && "font-semibold")}>
                  <div className="flex h-12 items-center justify-between gap-1">
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-xs sm:text-sm">{d.label}</span>
                      {d.today && <span className="text-[11px] font-medium text-accent-text">Today</span>}
                    </span>
                    <span
                      className={cn("flex size-7 shrink-0 items-center justify-center", d.note ? "text-accent-text" : "text-fg-subtle opacity-60")}
                      aria-hidden
                    >
                      <StickyNote className="size-3.5" fill={d.note ? "currentColor" : "none"} fillOpacity={0.2} />
                    </span>
                  </div>
                </th>
                {marks[row]!.map((m, col) => (
                  <td key={col} role="gridcell" className="p-1">
                    <button
                      type="button"
                      onClick={() => cycle(row, col)}
                      aria-label={`${HABITS[col]!.name}, ${d.label}: ${STATUS_LABELS[m]}`}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md transition-[background-color,transform,filter] duration-150",
                        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] active:scale-95",
                        STYLE[m]
                      )}
                    >
                      <span aria-hidden className="flex items-center justify-center">
                        {ICON[m]}
                      </span>
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-fg-muted">
        <span>Tap or click a cell to cycle Pending, Completed, Failed, Missed.</span>
        <span className="text-accent-text" aria-live="polite">
          {last ?? "Try it: nothing here is saved."}
        </span>
      </figcaption>
    </figure>
  );
}
