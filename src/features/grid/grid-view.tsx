"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, CalendarPlus, Keyboard, ListPlus, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, Kbd } from "@/components/ui/feedback";
import { Tooltip } from "@/components/ui/primitives";
import { createTask, deleteTask, reorderTasks, updateTask } from "@/server/actions/tasks";
import { setStatus } from "@/server/actions/entries";
import { addDays, daysBetween, formatDate, monthKey, formatMonth, type ISODate } from "@/lib/dates";
import { GRID_PAGE_DAYS, MAX_HISTORY_DAYS } from "@/lib/constants";
import { STATUS_KEYS, STATUS_LABELS, STATUS_MESSAGES, nextStatus, type StatusValue } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { StatusMap, SummaryDTO, TaskDTO } from "@/types/dto";
import { StatusCell } from "@/features/grid/status-cell";
import { HabitHeader } from "@/features/grid/habit-header";
import { AddHabit } from "@/features/grid/add-habit";
import { NotesSheet } from "@/features/grid/notes-sheet";
import { SummaryBar } from "@/features/grid/summary-bar";
import { isTypingTarget, openShortcuts } from "@/features/shell/shortcuts-dialog";

interface Change {
  taskId: string;
  date: ISODate;
  from: StatusValue;
  to: StatusValue;
}

const SUGGESTIONS = ["Read 20 pages", "Workout", "Meditate", "Drink 2L water", "No social media"];
const UNDO_LIMIT = 50;
const STATUS_TOAST_ID = "status-change";

export interface GridViewProps {
  today: ISODate;
  tasks: TaskDTO[];
  statuses: StatusMap;
  noteDates: ISODate[];
  summary: SummaryDTO;
  archivedCount: number;
  focusDate?: ISODate;
  focusHabit?: string;
  openNote?: boolean;
}

export function GridView(props: GridViewProps) {
  const { today, summary, archivedCount } = props;
  const router = useRouter();

  const [tasks, setTasks] = React.useState(props.tasks);
  const [statuses, setStatuses] = React.useState(props.statuses);
  const [noteDates, setNoteDates] = React.useState(() => new Set(props.noteDates));
  const [dayCount, setDayCount] = React.useState(() => {
    const needed = props.focusDate ? daysBetween(props.focusDate, today) + 1 : 0;
    return Math.min(MAX_HISTORY_DAYS, Math.max(GRID_PAGE_DAYS, Math.ceil(needed / GRID_PAGE_DAYS) * GRID_PAGE_DAYS));
  });
  const [focus, setFocus] = React.useState({ row: 0, col: 0 });
  const [noteDate, setNoteDate] = React.useState<ISODate | null>(props.openNote && props.focusDate ? props.focusDate : null);
  const [toDelete, setToDelete] = React.useState<TaskDTO | null>(null);
  const [dragFrom, setDragFrom] = React.useState<number | null>(null);

  const statusesRef = React.useRef(statuses);
  statusesRef.current = statuses;
  const undoStack = React.useRef<Change[]>([]);
  const latestRequest = React.useRef(new Map<string, number>());
  const requestSeq = React.useRef(0);
  const refreshTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);

  const days = React.useMemo(() => Array.from({ length: dayCount }, (_, i) => addDays(today, -i)), [dayCount, today]);

  /** Refresh server-computed stats (streaks) shortly after the last change. */
  const scheduleRefresh = React.useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => router.refresh(), 1200);
  }, [router]);

  React.useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  const writeCell = React.useCallback((taskId: string, date: ISODate, status: StatusValue) => {
    setStatuses((prev) => {
      const row = { ...(prev[taskId] ?? {}) };
      if (status === "PENDING") delete row[date];
      else row[date] = status;
      return { ...prev, [taskId]: row };
    });
  }, []);

  const applyStatus = React.useCallback(
    async (taskId: string, date: ISODate, to: StatusValue, mode: "change" | "undo" = "change") => {
      const from = statusesRef.current[taskId]?.[date] ?? "PENDING";
      if (from === to) return;
      const key = `${taskId}:${date}`;
      const seq = ++requestSeq.current;
      latestRequest.current.set(key, seq);
      writeCell(taskId, date, to);

      const change: Change = { taskId, date, from, to };
      if (mode === "change") {
        undoStack.current.push(change);
        if (undoStack.current.length > UNDO_LIMIT) undoStack.current.shift();
      }

      const res = await setStatus({ taskId, date, status: to });
      if (!res.ok) {
        if (latestRequest.current.get(key) === seq) writeCell(taskId, date, from);
        undoStack.current = undoStack.current.filter((c) => c !== change);
        toast.error("Couldn't save that change", {
          id: STATUS_TOAST_ID,
          description: res.error,
          action: { label: "Retry", onClick: () => void applyStatus(taskId, date, to, mode) },
        });
        return;
      }

      const taskName = tasksRef.current.find((t) => t.id === taskId)?.name ?? "Habit";
      if (mode === "undo") {
        toast("Change undone", { id: STATUS_TOAST_ID, description: `${taskName} is back to ${STATUS_LABELS[to].toLowerCase()}.` });
      } else {
        toast(`${taskName}: ${STATUS_LABELS[to]}`, {
          id: STATUS_TOAST_ID,
          description: `${formatDate(date, { weekday: "short", month: "short", day: "numeric" })}. ${STATUS_MESSAGES[to]}`,
          action: { label: "Undo", onClick: () => void undo() },
        });
      }
      for (const badge of res.data.unlocked) {
        toast.success(`Badge unlocked: ${badge.name}`, { description: "See it on your profile." });
      }
      scheduleRefresh();
    },
    // `undo` is stable through the ref below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [writeCell, scheduleRefresh]
  );

  const tasksRef = React.useRef(tasks);
  tasksRef.current = tasks;

  const undo = React.useCallback(() => {
    const last = undoStack.current.pop();
    if (!last) {
      toast("Nothing to undo", { id: STATUS_TOAST_ID });
      return;
    }
    void applyStatus(last.taskId, last.date, last.from, "undo");
  }, [applyStatus]);

  // Ctrl/Cmd+Z anywhere on the page (outside text fields).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !isTypingTarget(e.target)) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  // Jump to a date or habit requested by search.
  React.useEffect(() => {
    const row = props.focusDate ? days.indexOf(props.focusDate) : -1;
    const col = props.focusHabit ? tasks.findIndex((t) => t.id === props.focusHabit) : -1;
    if (row < 0 && col < 0) return;
    const target = { row: Math.max(row, 0), col: Math.max(col, 0) };
    setFocus(target);
    requestAnimationFrame(() => {
      const el = tableRef.current?.querySelector<HTMLElement>(`[data-cell="${target.row}:${target.col}"]`);
      el?.scrollIntoView({ block: "center", inline: "center" });
      el?.focus({ preventScroll: true });
    });
    // Only when the requested target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.focusDate, props.focusHabit]);

  const focusCell = React.useCallback((row: number, col: number) => {
    setFocus({ row, col });
    tableRef.current?.querySelector<HTMLElement>(`[data-cell="${row}:${col}"]`)?.focus();
  }, []);

  const onFocusCell = React.useCallback((row: number, col: number) => setFocus({ row, col }), []);

  const daysRef = React.useRef(days);
  daysRef.current = days;

  const onActivate = React.useCallback(
    (row: number, col: number) => {
      const task = tasksRef.current[col];
      const date = daysRef.current[row];
      if (!task || !date) return;
      void applyStatus(task.id, date, nextStatus(statusesRef.current[task.id]?.[date] ?? "PENDING"));
    },
    [applyStatus]
  );

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement;
    if (!target.dataset.cell) return;
    const { row, col } = focus;
    const lastRow = days.length - 1;
    const lastCol = tasks.length - 1;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [Math.max(0, row - 1), col],
      ArrowDown: [Math.min(lastRow, row + 1), col],
      ArrowLeft: [row, Math.max(0, col - 1)],
      ArrowRight: [row, Math.min(lastCol, col + 1)],
      Home: [row, 0],
      End: [row, lastCol],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      focusCell(move[0], move[1]);
      return;
    }
    const status = STATUS_KEYS[e.key];
    const task = tasks[col];
    const date = days[row];
    if (status && task && date) {
      e.preventDefault();
      void applyStatus(task.id, date, status);
    } else if (e.key.toLowerCase() === "n" && date) {
      e.preventDefault();
      setNoteDate(date);
    }
  };

  /* Habit management -------------------------------------------------- */

  const addHabit = async (name: string): Promise<boolean> => {
    const res = await createTask({ name });
    if (!res.ok) {
      toast.error("Couldn't add the habit", { description: res.error });
      return false;
    }
    setTasks((prev) => [...prev, res.data]);
    toast.success(`Added ${res.data.name}`, { description: "It counts from today." });
    scheduleRefresh();
    return true;
  };

  const patchTask = async (task: TaskDTO, patch: Partial<Pick<TaskDTO, "name" | "color">>, label: string) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...patch } : t)));
    const res = await updateTask({ taskId: task.id, ...patch });
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      toast.error(`Couldn't ${label}`, { description: res.error });
    }
  };

  const persistOrder = async (next: TaskDTO[], previous: TaskDTO[]) => {
    setTasks(next);
    const res = await reorderTasks({ orderedIds: next.map((t) => t.id) });
    if (!res.ok) {
      setTasks(previous);
      toast.error("Couldn't reorder habits", { description: res.error });
    }
  };

  const moveTask = (from: number, to: number) => {
    if (from === to || to < 0 || to >= tasks.length) return;
    const next = [...tasks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    void persistOrder(next, tasks);
  };

  const dragOrder = React.useRef<TaskDTO[] | null>(null);
  const onDragStart = (index: number) => {
    setDragFrom(index);
    dragOrder.current = tasks;
  };
  const onDragEnter = (index: number) => {
    if (dragFrom === null || index === dragFrom) return;
    setTasks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragFrom, 1);
      next.splice(index, 0, moved!);
      return next;
    });
    setDragFrom(index);
  };
  const onDragEnd = () => {
    const before = dragOrder.current;
    setDragFrom(null);
    dragOrder.current = null;
    if (before && before.map((t) => t.id).join() !== tasks.map((t) => t.id).join()) void persistOrder(tasks, before);
  };

  const archiveTask = async (task: TaskDTO) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const res = await updateTask({ taskId: task.id, archived: true });
    if (!res.ok) {
      setTasks(previous);
      toast.error("Couldn't archive the habit", { description: res.error });
      return;
    }
    toast(`Archived ${task.name}`, {
      description: "Its history is kept. Restore it from Settings.",
      action: {
        label: "Undo",
        onClick: async () => {
          const back = await updateTask({ taskId: task.id, archived: false });
          if (back.ok) {
            setTasks((prev) => [...prev, back.data].sort((a, b) => a.order - b.order));
            scheduleRefresh();
          } else toast.error("Couldn't restore the habit", { description: back.error });
        },
      },
    });
    scheduleRefresh();
  };

  const confirmDelete = async () => {
    const task = toDelete;
    setToDelete(null);
    if (!task) return;
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const res = await deleteTask({ taskId: task.id });
    if (!res.ok) {
      setTasks(previous);
      toast.error("Couldn't delete the habit", { description: res.error });
      return;
    }
    undoStack.current = undoStack.current.filter((c) => c.taskId !== task.id);
    toast.success(`Deleted ${task.name}`);
    scheduleRefresh();
  };

  const onNoteSaved = React.useCallback((date: ISODate, hasNote: boolean) => {
    setNoteDates((prev) => {
      const next = new Set(prev);
      if (hasNote) next.add(date);
      else next.delete(date);
      return next;
    });
  }, []);

  /* Render ------------------------------------------------------------- */

  const todayDone = tasks.filter((t) => statuses[t.id]?.[today] === "COMPLETED").length;
  const canLoadMore = dayCount < MAX_HISTORY_DAYS;

  return (
    <div className="container-page space-y-6 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-fg-muted">
            {formatDate(today, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        </div>
        {tasks.length > 0 && <AddHabit onAdd={addHabit} />}
      </div>

      <SummaryBar summary={summary} todayDone={todayDone} todayActive={tasks.length} />

      {tasks.length === 0 ? (
        <div className="glass rounded-xl">
          <EmptyState
            icon={ListPlus}
            title="Add your first habit"
            description="Each habit becomes a column. Every day you mark it Completed, Failed or Missed, and the evidence builds up."
            action={
              <div className="flex flex-col items-center gap-4">
                <AddHabit onAdd={addHabit} autoFocus />
                <div className="flex flex-wrap justify-center gap-2" aria-label="Suggestions">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} size="sm" variant="secondary" onClick={() => void addHabit(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
                {archivedCount > 0 && (
                  <Link href="/settings#archived" className="text-sm text-accent-text underline-offset-4 hover:underline">
                    You have {archivedCount} archived habit{archivedCount === 1 ? "" : "s"}
                  </Link>
                )}
              </div>
            }
          />
        </div>
      ) : (
        <section aria-label="Habit grid" className="glass overflow-hidden rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-xs text-fg-muted">
            <p>
              Click a cell to cycle Pending, Completed, Failed, Missed. Press <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd>{" "}
              <Kbd>0</Kbd> on a focused cell.
            </p>
            <div className="flex items-center gap-1">
              {archivedCount > 0 && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/settings#archived">
                    <Archive aria-hidden /> {archivedCount} archived
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={openShortcuts}>
                <Keyboard aria-hidden /> Shortcuts
              </Button>
            </div>
          </div>

          <div className="scrollbar-thin max-h-[calc(100dvh-220px)] min-h-80 overflow-auto">
            <table
              ref={tableRef}
              role="grid"
              aria-label="Habits by day. Rows are days, newest first; columns are habits."
              aria-rowcount={days.length + 1}
              className="w-max min-w-full border-separate border-spacing-0"
              onKeyDown={onGridKeyDown}
            >
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 top-0 z-30 w-28 bg-glass-strong px-3 text-left text-xs font-medium text-fg-muted backdrop-blur-xl sm:w-40"
                  >
                    Day
                  </th>
                  {tasks.map((task, i) => (
                    <HabitHeader
                      key={task.id}
                      task={task}
                      index={i}
                      count={tasks.length}
                      dragging={dragFrom === i}
                      onRename={(t, name) => void patchTask(t, { name }, "rename the habit")}
                      onColor={(t, color) => void patchTask(t, { color }, "change the colour")}
                      onMove={moveTask}
                      onArchive={(t) => void archiveTask(t)}
                      onDelete={setToDelete}
                      onDragStart={onDragStart}
                      onDragEnter={onDragEnter}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((date, row) => {
                  const isToday = date === today;
                  const newMonth = row > 0 && monthKey(date) !== monthKey(days[row - 1]!);
                  const label = formatDate(date, { weekday: "short", month: "short", day: "numeric" });
                  const hasNote = noteDates.has(date);
                  return (
                    <React.Fragment key={date}>
                      {newMonth && (
                        <tr aria-hidden>
                          <td colSpan={tasks.length + 1} className="sticky left-0 px-3 pb-1 pt-4">
                            <span className="sticky left-3 text-xs font-semibold uppercase tracking-wider text-accent-text">
                              {formatMonth(monthKey(date))}
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr className={cn(isToday && "[&>td]:bg-accent-soft/60 [&>th]:bg-accent-soft")}>
                        <th
                          scope="row"
                          className={cn(
                            "sticky left-0 z-10 border-r border-line bg-glass-strong px-2 text-left backdrop-blur-xl sm:px-3",
                            isToday && "font-semibold"
                          )}
                        >
                          <div className="flex h-12 items-center justify-between gap-1">
                            <span className="flex min-w-0 flex-col leading-tight">
                              <span className="truncate text-xs sm:text-sm">{label}</span>
                              {isToday && <span className="text-[11px] font-medium text-accent-text">Today</span>}
                            </span>
                            <Tooltip content={hasNote ? "Open note" : "Add note"}>
                              <button
                                type="button"
                                onClick={() => setNoteDate(date)}
                                aria-label={`${hasNote ? "Open" : "Add"} note for ${label}`}
                                className={cn(
                                  "flex size-7 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-glass-hover",
                                  hasNote ? "text-accent-text" : "text-fg-subtle opacity-60 hover:opacity-100"
                                )}
                              >
                                <StickyNote className="size-3.5" aria-hidden fill={hasNote ? "currentColor" : "none"} fillOpacity={0.2} />
                              </button>
                            </Tooltip>
                          </div>
                        </th>
                        {tasks.map((task, col) => (
                          <StatusCell
                            key={task.id}
                            row={row}
                            col={col}
                            taskName={task.name}
                            dateLabel={label}
                            status={statuses[task.id]?.[date] ?? "PENDING"}
                            focused={focus.row === row && focus.col === col}
                            beforeStart={date < task.startDate}
                            onActivate={onActivate}
                            onFocusCell={onFocusCell}
                          />
                        ))}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-center border-t p-4">
              {canLoadMore ? (
                <Button
                  variant="secondary"
                  onClick={() => setDayCount((n) => Math.min(MAX_HISTORY_DAYS, n + GRID_PAGE_DAYS))}
                >
                  <CalendarPlus aria-hidden /> Show {GRID_PAGE_DAYS} earlier days
                </Button>
              ) : (
                <p className="text-xs text-fg-muted">That is as far back as God Watch goes.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <NotesSheet date={noteDate} onClose={() => setNoteDate(null)} onSaved={onNoteSaved} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name ?? "habit"}?`}
        description="This permanently deletes the habit and every day recorded for it. To keep its history, archive it instead."
        confirmLabel="Delete forever"
        destructive
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
