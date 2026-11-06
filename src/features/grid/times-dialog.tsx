"use client";

import * as React from "react";
import { CopyCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/primitives";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  minutesOf,
  suggestedStart,
  type WeekTimes,
  type WeekdayKey,
} from "@/lib/schedule";
import type { TaskDTO } from "@/types/dto";

function addHour(time: string): string {
  const total = Math.min(minutesOf(time) + 60, 23 * 60 + 59);
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
      if (field === "start" && minutesOf(next.end) <= minutesOf(value)) next.end = addHour(value);
      return { ...prev, [day]: next };
    });
  };

  const copyToAll = () => {
    const first = WEEKDAY_ORDER.map((d) => draft[d]).find(Boolean);
    if (!first) return;
    setDraft(Object.fromEntries(WEEKDAY_ORDER.map((d) => [d, { ...first }])));
  };

  const invalid = Object.values(draft).some((w) => w && minutesOf(w.end) <= minutesOf(w.start));
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
            Pick the days this habit has a time slot. New slots start when your previous habit ends.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          {WEEKDAY_ORDER.map((day) => {
            const window = draft[day];
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
                      min={window.start}
                      onChange={(e) => setTime(day, "end", e.target.value)}
                      aria-label={`${WEEKDAY_LABELS[day]} end`}
                      className="h-9 bg-field px-2 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-ring"
                    />
                  </span>
                ) : (
                  <span className="text-sm text-fg-subtle">No time</span>
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
