import { CheckCircle2, Flame, Target, Trophy } from "lucide-react";
import type { SummaryDTO } from "@/types/dto";
import { pluralize } from "@/lib/utils";

function ProgressRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 52 52" className="size-14 -rotate-90" aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

/** Today's progress plus headline stats. */
export function SummaryBar({ summary, todayDone, todayActive }: { summary: SummaryDTO; todayDone: number; todayActive: number }) {
  const rate = todayActive > 0 ? Math.round((todayDone / todayActive) * 100) : 0;
  const stats = [
    { icon: Flame, label: "Current streak", value: pluralize(summary.currentStreak, "day") },
    { icon: Trophy, label: "Longest streak", value: pluralize(summary.longestStreak, "day") },
    { icon: Target, label: "Lifetime", value: `${summary.lifetimeCompletion}%` },
    { icon: CheckCircle2, label: "Completed", value: summary.totalCompleted.toLocaleString() },
  ];

  return (
    <section aria-label="Today's progress" className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
      <div className="glass flex items-center gap-4 rounded-lg p-4">
        <div className="relative">
          <ProgressRing value={rate} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{rate}%</span>
        </div>
        <div>
          <p className="text-sm text-fg-muted">Today</p>
          <p className="text-xl font-semibold tracking-tight" aria-live="polite">
            {todayDone} of {todayActive} done
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-lg p-4">
            <dt className="flex items-center gap-1.5 text-xs text-fg-muted">
              <s.icon className="size-3.5 text-accent-text" aria-hidden />
              {s.label}
            </dt>
            <dd className="mt-1 text-lg font-semibold tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
