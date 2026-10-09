"use client";

import * as React from "react";
import { Check, X, Minus, RotateCcw, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StatusValue } from "@/types";

const CYCLE: StatusValue[] = ["PENDING", "COMPLETED", "FAILED", "MISSED"];

const META: Record<
  StatusValue,
  { label: string; hint: string; key: string; className: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    hint: "Not marked yet — no pressure, just show up.",
    key: "0",
    className: "bg-muted text-muted-foreground",
    icon: <span className="text-base">·</span>,
  },
  COMPLETED: {
    label: "Completed",
    hint: "Another day, another win. The chain grows.",
    key: "1",
    className: "bg-success/15 text-success ring-1 ring-success/30",
    icon: <Check className="h-5 w-5" />,
  },
  FAILED: {
    label: "Failed",
    hint: "A miss is a lesson. Tomorrow is a fresh start.",
    key: "2",
    className: "bg-danger/15 text-danger ring-1 ring-danger/30",
    icon: <X className="h-5 w-5" />,
  },
  MISSED: {
    label: "Missed",
    hint: "Life happens. Don't break the chain — get back to it.",
    key: "3",
    className: "bg-warning/15 text-warning ring-1 ring-warning/30",
    icon: <Minus className="h-5 w-5" />,
  },
};

/**
 * Interactive status-cell demo — visitors click a cell to cycle
 * Pending → Completed → Failed → Missed, exactly like the real dashboard.
 */
export function HowItWorks() {
  const [status, setStatus] = React.useState<StatusValue>("PENDING");
  const [clicks, setClicks] = React.useState(0);
  const meta = META[status];

  const cycle = React.useCallback(() => {
    setStatus((prev) => {
      const i = CYCLE.indexOf(prev);
      return CYCLE[(i + 1) % CYCLE.length] ?? "PENDING";
    });
    setClicks((c) => c + 1);
  }, []);

  // Keyboard 0/1/2/3 while the demo is focused (mirrors the real shortcut).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = ["0", "1", "2", "3"].indexOf(e.key);
    if (idx >= 0) {
      e.preventDefault();
      setStatus(CYCLE[idx] ?? "PENDING");
      setClicks((c) => c + 1);
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      cycle();
    }
  };

  const steps = [
    {
      n: "01",
      title: "Pick a date",
      body: "The sticky rail auto-scrolls to today. Scroll back to any day in history.",
    },
    {
      n: "02",
      title: "Mark the cell",
      body: "Click to cycle — or press 1 / 2 / 3 / 0. Confirmation keeps you honest.",
    },
    {
      n: "03",
      title: "Watch evidence compound",
      body: "Streaks, heatmaps, and exports update from every cell you touch.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 border-y bg-card/30 py-24 sm:py-32"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-dense opacity-60 mask-fade-center" />
      </div>

      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title="One cell. Four honest answers."
          description="Try it yourself — click the cell or focus it and press 1, 2, 3, 0. This is the exact engine that powers your dashboard."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Interactive demo */}
          <Reveal>
            <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Thu · Oct 09</span>
                <span>
                  {clicks === 0 ? "Try clicking →" : `${clicks} marks made`}
                </span>
              </div>

              <div className="mt-4 flex gap-3">
                {/* Task label */}
                <div className="flex w-32 shrink-0 flex-col justify-center gap-1.5 rounded-xl border bg-background/60 px-3 py-3 sm:w-40">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <span className="truncate text-xs font-semibold sm:text-sm">
                      Deep Work
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="truncate text-xs font-semibold sm:text-sm">
                      Workout
                    </span>
                  </span>
                </div>

                {/* The magic cell + static neighbours */}
                <div className="flex flex-1 flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={cycle}
                    onKeyDown={onKeyDown}
                    aria-label={`Status: ${meta.label}. Click or press 1/2/3/0 to change.`}
                    aria-live="polite"
                    className={cn(
                      "flex h-12 items-center justify-center rounded-xl text-base font-medium transition-all duration-200 active:scale-95",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      meta.className
                    )}
                  >
                    {meta.icon}
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex h-10 items-center justify-center rounded-lg bg-success/15 text-success ring-1 ring-success/30">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex h-10 items-center justify-center rounded-lg bg-danger/15 text-danger ring-1 ring-danger/30">
                      <X className="h-4 w-4" />
                    </div>
                    <div className="flex h-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <span className="text-xs">·</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current state readout */}
              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border bg-background/60 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {meta.label}
                    <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                      {meta.key}
                    </kbd>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {meta.hint}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Reset demo"
                  onClick={() => {
                    setStatus("PENDING");
                    setClicks(0);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {CYCLE.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatus(s);
                      setClicks((c) => c + 1);
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      status === s
                        ? "border-foreground/30 bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {META[s].label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Steps */}
          <div className="flex flex-col gap-6">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                  {i < steps.length - 1 ? (
                    <ArrowRight
                      className="ml-auto hidden h-4 w-4 self-center text-muted-foreground/40 sm:block"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </Reveal>
            ))}

            <Reveal delay={0.3}>
              <Button
                asChild
                size="lg"
                className="mt-2 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-7 text-white shadow-lg shadow-amber-500/25 hover:from-amber-500/90 hover:to-orange-600/90"
              >
                <a href="#analytics">
                  See the analytics
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
