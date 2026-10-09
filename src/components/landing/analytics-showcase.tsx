import { Fragment } from "react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/landing/reveal";
import { TrendingUp, Flame, Target } from "lucide-react";

/**
 * Analytics showcase: a GitHub-style contribution heatmap built
 * deterministically (no Math.random) so SSR and hydration match.
 */

const WEEKS = 26;
const DAYS_PER_WEEK = 7;

/** Deterministic pseudo-intensity 0–4 for a given week/day coordinate. */
function intensity(week: number, day: number): number {
  const v = Math.sin(week * 12.9898 + day * 78.233) * 43758.5453;
  const frac = v - Math.floor(v);
  // Weighted toward activity: empty days are the exception.
  if (frac < 0.12) return 0;
  if (frac < 0.3) return 1;
  if (frac < 0.55) return 2;
  if (frac < 0.8) return 3;
  return 4;
}

const LEVEL_CLASS = [
  "bg-muted",
  "bg-amber-500/25",
  "bg-amber-500/45",
  "bg-amber-500/70",
  "bg-amber-500",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATS = [
  {
    icon: Flame,
    label: "Current streak",
    value: "42 days",
    tone: "text-warning",
  },
  {
    icon: TrendingUp,
    label: "Best month",
    value: "September · 94%",
    tone: "text-success",
  },
  {
    icon: Target,
    label: "Lifetime completion",
    value: "87%",
    tone: "text-primary",
  },
] as const;

/** Heatmap + stat showcase section. */
export function AnalyticsShowcase() {
  const cells: { week: number; day: number; level: number }[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      cells.push({ week: w, day: d, level: intensity(w, d) });
    }
  }

  return (
    <section id="analytics" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="Analytics"
          title="Your consistency, rendered visible."
          description="Heatmaps, streaks, task-wise performance, and best/worst months — all computed from the same cells you mark every day."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          {/* Heatmap card */}
          <Reveal className="lg:col-span-3">
            <div className="h-full rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Activity heatmap</h3>
                  <p className="text-xs text-muted-foreground">
                    Last 26 weeks
                  </p>
                </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>Less</span>
                {LEVEL_CLASS.map((cls, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-[3px] ${cls}`}
                    aria-hidden
                  />
                ))}
                <span>More</span>
              </div>
              </div>

              <div
                className="mt-4 grid gap-[3px]"
                style={{
                  gridTemplateColumns: `2.25rem repeat(${WEEKS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${DAYS_PER_WEEK}, auto)`,
                }}
                role="img"
                aria-label="Activity heatmap showing consistent daily tracking over 26 weeks"
              >
                {DAY_LABELS.map((label, day) => (
                  <Fragment key={label}>
                    <span className="flex items-center justify-end pr-1 text-[9px] leading-none text-muted-foreground">
                      {label}
                    </span>
                    {Array.from({ length: WEEKS }).map((_, week) => {
                      const level = cells[week * DAYS_PER_WEEK + day]?.level ?? 0;
                      return (
                        <span
                          key={week}
                          className={`aspect-square rounded-[3px] transition-colors ${LEVEL_CLASS[level]}`}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between pl-9 text-[10px] text-muted-foreground">
                <span>Mar</span>
                <span>Jun</span>
                <span>Sep</span>
                <span>Oct</span>
              </div>

              {/* Mini metrics footer */}
              <div className="mt-4 grid grid-cols-3 divide-x rounded-xl border bg-background/50">
                {[
                  { label: "This week", value: "92%" },
                  { label: "Days tracked", value: "182" },
                  { label: "Best run", value: "42" },
                ].map((m) => (
                  <div key={m.label} className="px-3 py-3 text-center">
                    <p className="text-lg font-semibold tracking-tight">
                      {m.value}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Stat cards */}
          <div className="grid gap-6 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <div className="group rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <s.icon className={`h-4 w-4 ${s.tone}`} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
                    {s.value}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
