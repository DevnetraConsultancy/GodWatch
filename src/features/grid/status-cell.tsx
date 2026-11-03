"use client";

import * as React from "react";
import { Check, Minus, X } from "lucide-react";
import { STATUS_LABELS, type StatusValue } from "@/lib/status";
import { cn } from "@/lib/utils";

const STYLE: Record<StatusValue, string> = {
  PENDING: "text-fg-subtle hover:bg-glass-hover",
  COMPLETED: "bg-success-soft text-success hover:brightness-110",
  FAILED: "bg-danger-soft text-danger hover:brightness-110",
  MISSED: "bg-warning-soft text-warning hover:brightness-110",
};

const ICON: Record<StatusValue, React.ReactNode> = {
  PENDING: <span className="size-1.5 rounded-full bg-current opacity-60" />,
  COMPLETED: <Check className="size-[18px]" strokeWidth={2.5} />,
  FAILED: <X className="size-[18px]" strokeWidth={2.5} />,
  MISSED: <Minus className="size-[18px]" strokeWidth={2.5} />,
};

export interface StatusCellProps {
  row: number;
  col: number;
  taskName: string;
  dateLabel: string;
  status: StatusValue;
  focused: boolean;
  beforeStart: boolean;
  onActivate: (row: number, col: number) => void;
  onFocusCell: (row: number, col: number) => void;
}

/** One grid cell. Memoised: a 90-day grid renders thousands of these. */
export const StatusCell = React.memo(function StatusCell({
  row,
  col,
  taskName,
  dateLabel,
  status,
  focused,
  beforeStart,
  onActivate,
  onFocusCell,
}: StatusCellProps) {
  return (
    <td role="gridcell" className="p-1">
      <button
        type="button"
        data-cell={`${row}:${col}`}
        tabIndex={focused ? 0 : -1}
        onClick={() => onActivate(row, col)}
        onFocus={() => onFocusCell(row, col)}
        aria-label={`${taskName}, ${dateLabel}: ${STATUS_LABELS[status]}`}
        className={cn(
          "flex h-10 w-full items-center justify-center rounded-md transition-[background-color,transform,filter] duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] active:scale-95",
          STYLE[status],
          beforeStart && status === "PENDING" && "opacity-40"
        )}
      >
        <span aria-hidden className="flex items-center justify-center">
          {ICON[status]}
        </span>
      </button>
    </td>
  );
});
