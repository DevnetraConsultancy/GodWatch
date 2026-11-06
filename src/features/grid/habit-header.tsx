"use client";

import * as React from "react";
import { Archive, ArrowLeft, ArrowRight, Check, Palette, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { TASK_COLORS, TASK_COLOR_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/dto";

export interface HabitHeaderProps {
  task: TaskDTO;
  index: number;
  count: number;
  dragging: boolean;
  onRename: (task: TaskDTO, name: string) => void;
  onColor: (task: TaskDTO, color: string) => void;
  onMove: (index: number, to: number) => void;
  onArchive: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

export function HabitHeader({
  task,
  index,
  count,
  dragging,
  onRename,
  onColor,
  onMove,
  onArchive,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: HabitHeaderProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(task.name);

  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== task.name) onRename(task, name.slice(0, 100));
    else setDraft(task.name);
  };

  return (
    <th
      scope="col"
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      // Every column the same width; long names wrap instead of truncating.
      className={cn(
        "sticky top-0 z-20 w-32 min-w-32 max-w-32 bg-glass-strong p-1 align-bottom backdrop-blur-xl transition-opacity",
        dragging && "opacity-40"
      )}
    >
      {editing ? (
        <Input
          autoFocus
          value={draft}
          maxLength={100}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(task.name);
              setEditing(false);
            }
          }}
          aria-label={`Rename ${task.name}`}
          className="h-9 px-2 text-xs"
        />
      ) : (
        <DropdownMenu>
          {/* The habit name itself opens its options: no extra three-dot button. */}
          <DropdownMenuTrigger
            title={`${task.name} (tap for options, drag to reorder)`}
            aria-label={`Options for ${task.name}`}
            className="flex min-h-10 w-full cursor-grab items-center justify-center gap-1.5 px-1 py-1 text-xs font-semibold transition-colors hover:bg-glass-hover active:cursor-grabbing"
          >
            <span className="mt-px size-2.5 shrink-0 rounded-full" style={{ backgroundColor: task.color }} aria-hidden />
            <span className="line-clamp-2 min-w-0 break-words text-left leading-tight">{task.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-52">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil aria-hidden /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(index, index - 1)}>
              <ArrowLeft aria-hidden /> Move left
            </DropdownMenuItem>
            <DropdownMenuItem disabled={index === count - 1} onSelect={() => onMove(index, index + 1)}>
              <ArrowRight aria-hidden /> Move right
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Palette className="size-3.5" aria-hidden /> Colour
            </DropdownMenuLabel>
            <div className="grid grid-cols-6 gap-1 px-2 pb-2" role="group" aria-label="Habit colour">
              {TASK_COLORS.map((color) => (
                <DropdownMenuItem
                  key={color}
                  onSelect={() => onColor(task, color)}
                  aria-label={TASK_COLOR_NAMES[color]}
                  className="flex size-7 min-h-0 items-center justify-center rounded-full p-0 data-[highlighted]:ring-2 data-[highlighted]:ring-ring"
                  style={{ backgroundColor: color }}
                >
                  {task.color === color && <Check className="!text-white" aria-hidden />}
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onArchive(task)}>
              <Archive aria-hidden /> Archive
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={() => onDelete(task)}>
              <Trash2 aria-hidden /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </th>
  );
}
