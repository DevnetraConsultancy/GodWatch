import { formatDate, type ISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface Day {
  date: ISODate;
  completed: number;
  active: number;
  rate: number;
}

function level(day: Day): number {
  if (day.active === 0) return -1;
  if (day.rate === 0) return 0;
  if (day.rate < 34) return 1;
  if (day.rate < 67) return 2;
  if (day.rate < 100) return 3;
  return 4;
}

// Only a perfect day earns full gold; partial days scale in neutral tones,
// so gold is never dimmed into black (which reads as brown).
const LEVEL_CLASS = [
  "bg-line",
  "bg-fg/20",
  "bg-fg/40",
  "bg-fg/65",
  "bg-accent",
];

/** Year heatmap: one column per week (Sunday first), one square per day. */
export function Heatmap({ days }: { days: Day[] }) {
  const first = days[0];
  if (!first) return null;
  const leading = new Date(`${first.date}T00:00:00Z`).getUTCDay();
  const cells: (Day | null)[] = [...Array<null>(leading).fill(null), ...days];
  const weeks: (Day | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <figure className="space-y-3">
      <div className="scrollbar-thin overflow-x-auto pb-2" tabIndex={0} role="region" aria-label="Heatmap, scrolls sideways">
        <div className="flex w-max gap-[3px]" role="img" aria-label="Completion heatmap for the last year. Details are in the tables on this page.">
          {weeks.map((week, w) => (
            <div key={w} className="grid grid-rows-7 gap-[3px]">
              {week.map((day, d) =>
                day ? (
                  <span
                    key={day.date}
                    title={`${formatDate(day.date, { month: "short", day: "numeric", year: "numeric" })}: ${
                      day.active === 0 ? "no habits" : `${day.completed}/${day.active} (${day.rate}%)`
                    }`}
                    className={cn(
                      "size-3 rounded-none",
                      level(day) < 0 ? "bg-transparent ring-1 ring-inset ring-line" : LEVEL_CLASS[level(day)]
                    )}
                  />
                ) : (
                  <span key={`pad-${d}`} className="size-3" />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="flex items-center justify-end gap-1.5 text-xs text-fg-muted">
        Less
        {LEVEL_CLASS.map((c) => (
          <span key={c} className={cn("size-3 rounded-none", c)} aria-hidden />
        ))}
        More
      </figcaption>
    </figure>
  );
}
