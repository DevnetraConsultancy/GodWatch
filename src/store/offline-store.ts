"use client";

import { create } from "zustand";

/**
 * Offline queue store.
 * When the user performs an action while offline, it is queued locally
 * and replayed when connectivity returns.
 */

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  queue: QueuedAction[];
  pendingCount: number;
  setIsOnline: (online: boolean) => void;
  enqueue: (action: Omit<QueuedAction, "id" | "timestamp">) => void;
  dequeue: (id: string) => void;
  clear: () => void;
  setPendingCount: (count: number) => void;
}

let counter = 0;

export const useOfflineStore = create<OfflineState>()((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  queue: [],
  pendingCount: 0,

  setIsOnline: (online) => set({ isOnline: online }),

  enqueue: (action) =>
    set((s) => ({
      queue: [
        ...s.queue,
        { ...action, id: `q_${Date.now()}_${counter++}`, timestamp: Date.now() },
      ],
      pendingCount: s.pendingCount + 1,
    })),

  dequeue: (id) =>
    set((s) => ({
      queue: s.queue.filter((a) => a.id !== id),
      pendingCount: Math.max(0, s.pendingCount - 1),
    })),

  clear: () => set({ queue: [], pendingCount: 0 }),

  setPendingCount: (count) => set({ pendingCount: count }),
}));

