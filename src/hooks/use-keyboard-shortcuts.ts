"use client";

import { useEffect } from "react";

/**
 * Global keyboard shortcut hook.
 *
 * 1/2/3/0 → set selected cell to COMPLETED/FAILED/MISSED/PENDING
 * Cmd/Ctrl+K → open search
 * Cmd/Ctrl+Z → undo
 */

interface ShortcutHandlers {
  onStatus?: (status: "COMPLETED" | "FAILED" | "MISSED" | "PENDING") => void;
  onSearch?: () => void;
  onUndo?: () => void;
  focusedCell?: { taskId: string; date: string } | null;
  onSetStatus?: (taskId: string, date: string, status: "COMPLETED" | "FAILED" | "MISSED" | "PENDING") => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onStatus,
  onSearch,
  onUndo,
  focusedCell,
  onSetStatus,
  enabled = true,
}: ShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't trigger when typing in inputs/textareas/contenteditable.
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K → search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onSearch?.();
        return;
      }

      // Cmd/Ctrl + Z → undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // 1/2/3/0 status shortcuts
      const map: Record<string, "COMPLETED" | "FAILED" | "MISSED" | "PENDING"> = {
        "1": "COMPLETED",
        "2": "FAILED",
        "3": "MISSED",
        "0": "PENDING",
      };
      if (map[e.key]) {
        e.preventDefault();
        // If a focused cell exists, apply to it via onSetStatus.
        if (onSetStatus && focusedCell) {
          onSetStatus(focusedCell.taskId, focusedCell.date, map[e.key]!);
        } else {
          onStatus?.(map[e.key]!);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onStatus, onSearch, onUndo, onSetStatus, focusedCell, enabled]);
}

