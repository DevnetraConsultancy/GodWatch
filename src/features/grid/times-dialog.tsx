"use client";

import * as React from "react";
import { AlertTriangle, CopyCheck, MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/primitives";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  formatWindow,
  isOvernight,
  minutesOf,
  overlappingHabits,
  suggestedStart,
  type WeekTimes,
  type WeekdayKey,
} from "@/lib/schedule";
import type { TaskDTO } from "@/types/dto";

/** One hour later, wrapping past midnight ("23:30" -> "00:30"). */
function addHour(time: string): string {
  const total = (minutesOf(time) + 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function TimesDialog({
  task,
  tasks,
  onClose,
  onSave,
}: {
  task: TaskDTO | null;
  tasks: TaskDTO[];
  onClose: () => void;
  onSave: (task: TaskDTO, times: WeekTimes | null) => void;
}) {
  const [draft, setDraft] = React.useState<WeekTimes>({});
  React.useEffect(() => {
    if (task) setDraft(task.times ?? {});
  }, [task]);

  if (!task) return null;
  // Earlier columns feed the "starts when the previous one ends" suggestion.
  const earlier = tasks.filter((t) => t.order < task.order).map((t) => t.times);
  const others = tasks.filter((t) => t.id !== task.id);

  const toggle = (day: WeekdayKey, on: boolean) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (!on) {
        delete next[day];
      } else {
        const start = suggestedStart(earlier, day) ?? "08:00";
        next[day] = { start, end: addHour(start) };
      }
      return next;
    });
  };

  const setTime = (day: WeekdayKey, field: "start" | "end", value: string) => {
    if (!value) return;
    setDraft((prev) => {
      const window = prev[day];
      if (!window) return prev;
      const next = { ...window, [field]: value };
      // Any order is allowed (an end before the start runs overnight);
      // only an identical start and end is pushed apart.
      if (next.start === next.end) next.end = addHour(next.start);
      return { ...prev, [day]: next };
    });
  };

  const copyToAll = () => {
    const first = WEEKDAY_ORDER.map((d) => draft[d]).find(Boolean);
    if (!first) return;
    setDraft(Object.fromEntries(WEEKDAY_ORDER.map((d) => [d, { ...first }])));
  };

  const invalid = Object.values(draft).some((w) => w && w.start === w.end);
  const save = () => {
    const days = Object.keys(draft).length;
    onSave(task, days > 0 ? draft : null);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Times for {task.name}</DialogTitle>
          <DialogDescription>
            Pick the days this habit has a time slot. A slot may run past midnight, and it may overlap another
            habit; you will only see a warning.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          {WEEKDAY_ORDER.map((day) => {
            const window = draft[day];
            const overlaps = window ? overlappingHabits(window, day, others) : [];
            return (
              <div key={day} className="flex min-h-12 flex-wrap items-center gap-3 py-2">
                <Switch
                  checked={!!window}
                  onCheckedChange={(on) => toggle(day, on)}
                  aria-label={`Timed on ${WEEKDAY_LABELS[day]}`}
                />
                <span className="w-24 text-sm">{WEEKDAY_LABELS[day]}</span>
                {window ? (
                  <span className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={window.start}
                      onChange={(e) => setTime(day, "start", e.target.value)}
                      aria-label={`${WEEKDAY_LABELS[day]} start`}
                      className="h-9 bg-field px-2 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-ring"
                    />
                    to
                    <input
                      type="time"
                      value={window.end}
                      onChange={(e) => setTime(day, "end", e.target.value)}
                      aria-label={`${WEEKDAY_LABELS[day]} end`}
                      className="h-9 bg-field px-2 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-ring"
                    />
                    {isOvernight(window) && (
                      <span className="inline-flex items-center gap-1 text-xs text-fg-muted" title="Ends the next morning">
                        <MoonStar className="size-3.5" aria-hidden /> next day
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-fg-subtle">No time</span>
                )}
                {overlaps.length > 0 && (
                  <p className="flex w-full items-start gap-1.5 pl-14 text-xs text-warning" role="status">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>
                      Overlaps{" "}
                      {overlaps.map((t, i) => (
                        <React.Fragment key={t.id}>
                          {i > 0 && ", "}
                          <span className="font-medium">{t.name}</span> ({formatWindow(t.times![day]!)})
                        </React.Fragment>
                      ))}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={copyToAll}>
            <CopyCheck aria-hidden /> Same time every day
          </Button>
          <Button onClick={save} disabled={invalid}>
            Save times
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
