import { Check, Flame, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Mark = "done" | "failed" | "missed" | "pending";

const HABITS = ["Deep work", "Workout", "Read 20 pages", "Meditate"];
const DAYS: { label: string; marks: Mark[]; today?: boolean }[] = [
  { label: "Thu, Mar 13", marks: ["done", "pending", "done", "pending"], today: true },
  { label: "Wed, Mar 12", marks: ["done", "done", "done", "done"] },
  { label: "Tue, Mar 11", marks: ["done", "failed", "done", "done"] },
  { label: "Mon, Mar 10", marks: ["done", "done", "missed", "done"] },
  { label: "Sun, Mar 9", marks: ["done", "done", "done", "failed"] },
];

const MARK: Record<Mark, { cls: string; icon: React.ReactNode; label: string }> = {
  done: { cls: "bg-success-soft text-success", icon: <Check className="size-4" strokeWidth={2.5} />, label: "Completed" },
  failed: { cls: "bg-danger-soft text-danger", icon: <X className="size-4" strokeWidth={2.5} />, label: "Failed" },
  missed: { cls: "bg-warning-soft text-warning", icon: <Minus className="size-4" strokeWidth={2.5} />, label: "Missed" },
  pending: { cls: "text-fg-subtle", icon: <span className="size-1.5 rounded-full bg-current opacity-60" />, label: "Pending" },
};

/** Static illustration of the dashboard grid (example data). */
export function ProductPreview({ className }: { className?: string }) {
  return (
    <figure className={cn("glass-strong overflow-hidden rounded-xl", className)} aria-label="Example of the God Watch grid">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-danger/60" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-text">
          <Flame className="size-3.5" aria-hidden /> Example: 12-day streak
        </span>
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-1 p-2 text-left">
          <thead>
            <tr>
              <th className="px-2 text-xs font-medium text-fg-muted">Day</th>
              {HABITS.map((h) => (
                <th key={h} className="px-2 text-xs font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d) => (
              <tr key={d.label}>
                <th scope="row" className={cn("rounded-md px-2 text-xs font-normal", d.today && "bg-accent-soft font-semibold")}>
                  {d.label}
                  {d.today && <span className="block text-[11px] text-accent-text">Today</span>}
                </th>
                {d.marks.map((m, i) => (
                  <td key={i}>
                    <span
                      className={cn("flex h-9 items-center justify-center rounded-md", MARK[m].cls)}
                      aria-label={`${HABITS[i]}: ${MARK[m].label}`}
                      role="img"
                    >
                      {MARK[m].icon}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
