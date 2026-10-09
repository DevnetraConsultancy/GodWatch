"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn, toISODate, formatDateShort, rangeISODates } from "@/lib/utils";
import { STATUS_CYCLE, STATUS_TOASTS } from "@/lib/constants";
import { STATUS_LABELS } from "@/lib/constants";
import type { StatusValue, TaskDTO } from "@/types";
import {
  createTask,
  deleteTask,
  updateStatus,
  updateTask,
} from "@/lib/actions";

const STATUS_ICON: Record<StatusValue, React.ReactNode> = {
  PENDING: <span className="text-xs text-muted-foreground">·</span>,
  COMPLETED: <Check className="h-4 w-4 text-success" />,
  FAILED: <X className="h-4 w-4 text-danger" />,
  MISSED: <Minus className="h-4 w-4 text-warning" />,
};

const STATUS_BG: Record<StatusValue, string> = {
  PENDING: "hover:bg-muted/50",
  COMPLETED: "bg-success/10 hover:bg-success/20",
  FAILED: "bg-danger/10 hover:bg-danger/20",
  MISSED: "bg-warning/10 hover:bg-warning/20",
};

interface GridViewProps {
  initialTasks: TaskDTO[];
  initialStatuses: Record<string, Record<string, StatusValue>>;
  summary: { todayCompleted: number; todayTotal: number; currentStreak: number; longestStreak: number; completionRate: number };
  sessionUser: { name: string; email: string; image: string | null };
  stats: { currentStreak: number; longestStreak: number; totalCompleted: number; totalFailed: number; totalMissed: number; lifetimeCompletion: number };
}

const DAY_RANGE_DAYS = 90;

export function GridView({
  initialTasks,
  initialStatuses,
  summary,
  sessionUser,
  stats,
}: GridViewProps) {
  const [tasks, setTasks] = React.useState<TaskDTO[]>(initialTasks);
  const [statuses, setStatuses] = React.useState(initialStatuses);
  const [newTaskName, setNewTaskName] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [editingTask, setEditingTask] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [statusConfirm, setStatusConfirm] = React.useState<{
    taskId: string; date: string; nextStatus: StatusValue;
  } | null>(null);

  // Day range: today first, then back
  const days = React.useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (DAY_RANGE_DAYS - 1));
    return rangeISODates(start, today).reverse();
  }, []);

  const todayStr = toISODate(new Date());

  // Group days by month
  const monthGroups = React.useMemo(() => {
    const groups: { label: string; days: string[] }[] = [];
    let current: { label: string; days: string[] } | null = null;
    for (const date of days) {
      const monthLabel = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "long", year: "numeric", timeZone: "UTC",
      });
      if (!current || current.label !== monthLabel) {
        current = { label: monthLabel, days: [] };
        groups.push(current);
      }
      current.days.push(date);
    }
    return groups;
  }, [days]);

  const cycleStatus = (current: StatusValue): StatusValue => {
    const idx = STATUS_CYCLE.indexOf(current as typeof STATUS_CYCLE[number]);
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]!;
  };

  const handleCellClick = (taskId: string, date: string) => {
    const current = statuses[taskId]?.[date] ?? "PENDING";
    const next = cycleStatus(current);
    setStatusConfirm({ taskId, date, nextStatus: next });
  };

  const handleStatusConfirm = async () => {
    if (!statusConfirm) return;
    const { taskId, date, nextStatus } = statusConfirm;
    setStatusConfirm(null);
    // Optimistic
    setStatuses((prev) => ({
      ...prev,
      [taskId]: { ...(prev[taskId] ?? {}), [date]: nextStatus },
    }));
    toast.success(STATUS_LABELS[nextStatus], {
      description: STATUS_TOASTS[nextStatus],
    });
    try {
      const res = await updateStatus({ taskId, date, status: nextStatus });
      if (!res.ok) throw new Error(res.message);
    } catch (e) {
      toast.error("Failed to sync, will retry");
    }
  };

  const handleAddTask = async () => {
    const name = newTaskName.trim();
    if (!name) return;
    const res = await createTask({ name, color: "#6366f1" });
    if (res.ok && res.data) {
      const task = res.data as TaskDTO;
      setTasks((prev) => [...prev, task]);
      setNewTaskName("");
      toast.success("Task added", { description: `"${name}" is ready.` });
    } else {
      toast.error(res.message ?? "Failed to add task");
    }
  };

  const handleRename = async (taskId: string) => {
    const name = editName.trim();
    if (!name || name === tasks.find((t) => t.id === taskId)?.name) {
      setEditingTask(null);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, name } : t)));
    setEditingTask(null);
    const res = await updateTask(taskId, { name });
    if (!res.ok) toast.error(res.message ?? "Failed to rename");
    else toast.success("Task renamed");
  };

  const handleDelete = async (taskId: string) => {
    setDeleteConfirm(null);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const res = await deleteTask(taskId);
    if (res.ok) toast.success("Task deleted");
    else toast.error(res.message ?? "Failed to delete");
  };

  return (
    <div className="container pb-16">
      {/* Top Bar - Profile Menu */}
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          {sessionUser.image ? (
            <img
              src={sessionUser.image}
              alt={sessionUser.name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {sessionUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">{sessionUser.name}</p>
            <p className="text-xs text-muted-foreground">{sessionUser.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="text-right">
            <p className="font-semibold text-foreground">{stats.currentStreak} days</p>
            <p>Current Streak</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <p className="font-semibold text-foreground">{stats.lifetimeCompletion}%</p>
            <p>Lifetime</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <p className="font-semibold text-foreground">{stats.totalCompleted}</p>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Title Bar */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">God Watch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every Day Leaves Evidence
        </p>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Today: {summary.todayCompleted}/{summary.todayTotal} ({summary.completionRate}%)</span>
          <span>Streak: {summary.currentStreak} days</span>
        </div>
      </div>

      {/* Excel-like Grid */}
      <div className="overflow-x-auto rounded-xl border">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex border-b bg-muted/30">
            {/* Date column header */}
            <div className="sticky left-0 z-10 flex w-[140px] shrink-0 items-center border-r bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
              Date
            </div>
            {/* Task column headers */}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex w-[130px] shrink-0 items-center justify-between border-r px-2 py-1.5"
              >
                {editingTask === task.id ? (
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(task.id);
                      if (e.key === "Escape") setEditingTask(null);
                    }}
                    className="h-6 text-xs"
                  />
                ) : (
                  <span
                    className="cursor-pointer truncate text-xs font-medium hover:underline"
                    onClick={() => {
                      setEditName(task.name);
                      setEditingTask(task.id);
                    }}
                    title={task.name}
                  >
                    {task.name}
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => { setEditName(task.name); setEditingTask(task.id); }}>
                      <Pencil className="mr-2 h-4 w-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteConfirm(task.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {/* Add task column header */}
            <div className="flex w-[130px] shrink-0 items-center gap-1 px-2 py-1.5">
              <Input
                placeholder="+ Add task"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask();
                }}
                className="h-7 text-xs"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={handleAddTask}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Grid Rows */}
          <div className="divide-y">
            {monthGroups.map((group) => (
              <React.Fragment key={group.label}>
                {/* Month separator row */}
                <div className="flex border-b-2 border-primary/10 bg-primary/5">
                  <div className="sticky left-0 z-10 flex w-[140px] shrink-0 items-center border-r bg-primary/5 px-3 py-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {group.label}
                    </span>
                  </div>
                  <div className="flex-1" />
                </div>
                {/* Days in this month */}
                {group.days.map((date) => {
                  const isToday = date === todayStr;
                  const d = new Date(`${date}T00:00:00Z`);
                  const dayLabel = d.toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
                  });
                  return (
                    <div
                      key={date}
                      className={cn(
                        "flex transition-colors",
                        isToday && "bg-primary/5"
                      )}
                    >
                      {/* Date cell */}
                      <div
                        className={cn(
                          "sticky left-0 z-10 flex w-[140px] shrink-0 items-center border-r bg-card px-3 py-2",
                          isToday && "bg-primary/5 font-semibold"
                        )}
                      >
                        <span className={cn("text-xs", isToday && "font-semibold")}>
                          {dayLabel}
                        </span>
                        {isToday && (
                          <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      {/* Status cells */}
                      {tasks.map((task) => {
                        const status = statuses[task.id]?.[date] ?? "PENDING";
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleCellClick(task.id, date)}
                            className={cn(
                              "flex w-[130px] shrink-0 items-center justify-center border-r py-2 transition-colors",
                              STATUS_BG[status]
                            )}
                          >
                            {STATUS_ICON[status]}
                          </button>
                        );
                      })}
                      {/* Empty cell for add-task column */}
                      <div className="w-[130px] shrink-0" />
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Status confirmation dialog */}
      <AlertDialog
        open={!!statusConfirm}
        onOpenChange={(o) => { if (!o) setStatusConfirm(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark as {statusConfirm ? STATUS_LABELS[statusConfirm.nextStatus] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusConfirm && (
                <>
                  Task: <strong>{tasks.find((t) => t.id === statusConfirm.taskId)?.name}</strong>
                  <br />
                  Date: <strong>{formatDateShort(statusConfirm.date)}</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{tasks.find((t) => t.id === deleteConfirm)?.name}” and all its data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

