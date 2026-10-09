"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, X, Minus, Flame, TrendingUp, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusValue } from "@/types";

/**
 * Hero product mock — a stylized, animated replica of the God Watch dashboard.
 * Fully deterministic (no Math.random) so SSR and hydration always match.
 */

const COLUMNS = [
  {
    name: "Deep Work",
    color: "#6366f1",
    cells: [
      "COMPLETED",
      "COMPLETED",
      "FAILED",
      "COMPLETED",
      "COMPLETED",
      "PENDING",
    ] as StatusValue[],
  },
  {
    name: "Workout",
    color: "#10b981",
    cells: [
      "COMPLETED",
      "MISSED",
      "COMPLETED",
      "COMPLETED",
      "FAILED",
      "COMPLETED",
    ] as StatusValue[],
  },
  {
    name: "Read 20 pages",
    color: "#f59e0b",
    cells: [
      "COMPLETED",
      "COMPLETED",
      "COMPLETED",
      "PENDING",
      "COMPLETED",
      "COMPLETED",
    ] as StatusValue[],
  },
  {
    name: "Meditate",
    color: "#8b5cf6",
    cells: [
      "FAILED",
      "COMPLETED",
      "COMPLETED",
      "COMPLETED",
      "MISSED",
      "PENDING",
    ] as StatusValue[],
  },
] as const;

const DAYS = [
  { day: "Mon", num: "06" },
  { day: "Tue", num: "07" },
  { day: "Wed", num: "08" },
  { day: "Thu", num: "09" },
  { day: "Fri", num: "10" },
  { day: "Sat", num: "11" },
] as const;

const CELL_STYLE: Record<StatusValue, string> = {
  PENDING: "bg-muted text-muted-foreground",
  COMPLETED: "bg-success/15 text-success ring-1 ring-success/30",
  FAILED: "bg-danger/15 text-danger ring-1 ring-danger/30",
  MISSED: "bg-warning/15 text-warning ring-1 ring-warning/30",
};

const CELL_ICON: Record<StatusValue, React.ReactNode> = {
  PENDING: <span className="text-xs">·</span>,
  COMPLETED: <Check className="h-3.5 w-3.5" />,
  FAILED: <X className="h-3.5 w-3.5" />,
  MISSED: <Minus className="h-3.5 w-3.5" />,
};

function FloatingChip({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={cn(
        "absolute hidden items-center gap-2 rounded-xl border bg-card/90 px-3 py-2 text-xs font-medium shadow-xl backdrop-blur-xl sm:flex",
        className
      )}
    >
      {children}
      {!reduced ? (
        <span className="absolute inset-0 -z-10 animate-float rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 blur-xl" />
      ) : null}
    </motion.div>
  );
}

/** Stylized dashboard replica used in the hero. */
export function ProductMock() {
  const reduced = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Aura behind the window */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-emerald-500/15 blur-3xl"
      />

      {/* Browser window */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="overflow-hidden rounded-2xl border bg-card/80 shadow-2xl shadow-black/10 backdrop-blur-xl"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 rounded-md bg-background/60 px-3 py-1 text-[11px] text-muted-foreground">
            <span className="truncate">godwatch.app/dashboard</span>
          </div>
          <div className="hidden items-center gap-1 rounded-md border bg-background/60 px-2 py-1 text-[10px] text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </div>
        </div>

        {/* App body */}
        <div className="flex gap-2 p-3 sm:gap-3 sm:p-4">
          {/* Date rail */}
          <div className="flex w-12 shrink-0 flex-col gap-1 sm:w-14">
            {DAYS.map((d, i) => (
              <motion.div
                key={d.day}
                initial={reduced ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
                className={cn(
                  "flex flex-col items-center rounded-lg py-1.5",
                  i === DAYS.length - 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                <span className="text-[9px] uppercase opacity-70">{d.day}</span>
                <span className="text-xs font-semibold">{d.num}</span>
              </motion.div>
            ))}
          </div>

          {/* Task columns */}
          <div className="flex flex-1 gap-2 overflow-hidden sm:gap-3">
            {COLUMNS.map((col, ci) => (
              <motion.div
                key={col.name}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 + ci * 0.1 }}
                className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl border bg-card p-2 shadow-sm"
              >
                <div className="flex items-center gap-1.5 px-0.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: col.color }}
                    aria-hidden
                  />
                  <span className="truncate text-[11px] font-semibold">
                    {col.name}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {col.cells.map((status, ri) => (
                    <motion.div
                      key={`${col.name}-${ri}`}
                      initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.75 + ci * 0.1 + ri * 0.05,
                        ease: "backOut",
                      }}
                      className={cn(
                        "flex h-8 items-center justify-center rounded-lg text-sm font-medium sm:h-9",
                        CELL_STYLE[status]
                      )}
                    >
                      {CELL_ICON[status]}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>6-day streak alive</span>
          <span className="hidden sm:inline">Press 1 / 2 / 3 / 0 to mark</span>
          <span className="font-semibold text-success">87% this week</span>
        </div>
      </motion.div>

      {/* Floating chips */}
      <FloatingChip
        className="-left-4 top-16 lg:-left-10"
        delay={1.1}
      >
        <Flame className="h-3.5 w-3.5 text-warning" />
        <span>42-day streak</span>
      </FloatingChip>

      <FloatingChip
        className="-right-4 bottom-24 lg:-right-12"
        delay={1.3}
      >
        <TrendingUp className="h-3.5 w-3.5 text-success" />
        <span>+18% vs last month</span>
      </FloatingChip>
    </div>
  );
}
