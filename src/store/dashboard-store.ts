"use client";

import { create } from "zustand";
import type { StatusValue, TaskDTO } from "@/types";
import { STATUS_CYCLE } from "@/lib/constants";

/**
 * Dashboard client state (Zustand).
 *
 * Responsibilities:
 *  - Optimistic updates for cell status changes
 *  - Task CRUD local mirrors (so the grid re-renders instantly)
 *  - Undo stack for "Undo recent action"
 *  - Selected date, keyboard-navigation focus
 */

export interface CellState {
  taskId: string;
  date: string;
  status: StatusValue;
}

export interface UndoEntry {
  type: "STATUS_CHANGED" | "TASK_CREATED" | "TASK_DELETED" | "TASK_UPDATED";
  payload: unknown;
}

interface DashboardState {
  tasks: TaskDTO[];
  statuses: Record<string, Record<string, StatusValue>>;
  selectedDate: string;
  undoStack: UndoEntry[];
  searchOpen: boolean;

  setTasks: (tasks: TaskDTO[]) => void;
  setStatuses: (statuses: Record<string, Record<string, StatusValue>>) => void;
  addTask: (task: TaskDTO) => void;
  updateTaskLocal: (task: TaskDTO) => void;
  removeTaskLocal: (taskId: string) => void;
  setCellStatus: (taskId: string, date: string, status: StatusValue) => void;
  cycleStatus: (taskId: string, date: string, skipConfirmation?: boolean) => StatusValue;
  setSelectedDate: (date: string) => void;
  pushUndo: (entry: UndoEntry) => void;
  popUndo: () => UndoEntry | undefined;
  setSearchOpen: (open: boolean) => void;
}

const isToday = (date: string) =>
  date === new Date().toISOString().slice(0, 10);

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  tasks: [],
  statuses: {},
  selectedDate: new Date().toISOString().slice(0, 10),
  undoStack: [],
  searchOpen: false,

  setTasks: (tasks) => set({ tasks }),
  setStatuses: (statuses) => set({ statuses }),

  addTask: (task) =>
    set((s) => ({ tasks: [...s.tasks, task] })),

  updateTaskLocal: (task) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === task.id ? task : t)),
    })),

  removeTaskLocal: (taskId) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) })),

  setCellStatus: (taskId, date, status) =>
    set((s) => ({
      statuses: {
        ...s.statuses,
        [taskId]: { ...s.statuses[taskId], [date]: status },
      },
    })),

  cycleStatus: (taskId, date, skipConfirmation = false) => {
    const { statuses } = get();
    const current = statuses[taskId]?.[date] ?? "PENDING";
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] as StatusValue;
    get().setCellStatus(taskId, date, next);
    return next;
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  pushUndo: (entry) =>
    set((s) => ({ undoStack: [...s.undoStack.slice(-49), entry] })),

  popUndo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return undefined;
    const entry = undoStack[undoStack.length - 1];
    set({ undoStack: undoStack.slice(0, -1) });
    return entry;
  },

  setSearchOpen: (open) => set({ searchOpen: open }),
}));

