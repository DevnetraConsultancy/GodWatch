"use client";

import * as React from "react";
import {
  CalendarRange,
  Flame,
  ChartPie,
  Keyboard,
  Download,
  WifiOff,
  Bell,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Wider card in the bento grid. */
  wide?: boolean;
  /** Visual teaser rendered inside the card. */
  visual?: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    icon: CalendarRange,
    title: "Date-first dashboard",
    description:
      "Your habits live in a grid with today on top. Every day is a row of evidence, and months of history are one scroll away.",
    wide: true,
    visual: (
      <div className="mt-4 flex gap-1.5 overflow-hidden rounded-lg border bg-background/60 p-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
          <div
            key={d}
            className={cn(
              "flex flex-1 flex-col items-center rounded-md py-2 text-[10px]",
              i === 3
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground"
            )}
          >
            <span className="uppercase opacity-70">{d}</span>
            <span className="font-semibold">{10 + i}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Flame,
    title: "Streaks that mean something",
    description:
      "Current and longest streaks count only days where every task was completed.",
    visual: (
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight text-gradient-gold">
          42
        </span>
        <span className="text-sm text-muted-foreground">day streak</span>
      </div>
    ),
  },
  {
    icon: ChartPie,
    title: "Analytics depth",
    description:
      "Daily, weekly, monthly, and yearly completion rates with pie, bar, and heatmap views.",
    visual: (
      <div className="mt-4 flex h-16 items-end gap-1.5">
        {[40, 65, 55, 80, 70, 95, 88].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-amber-500/70 to-orange-400/70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Keyboard,
    title: "Keyboard-first",
    description:
      "Mark cells with 1 / 2 / 3 / 0, search with ⌘K, undo with ⌘Z. Your hands never leave home row.",
    visual: (
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { k: "1", l: "Done" },
          { k: "2", l: "Failed" },
          { k: "3", l: "Missed" },
          { k: "0", l: "Pending" },
          { k: "⌘K", l: "Search" },
          { k: "⌘Z", l: "Undo" },
        ].map((s) => (
          <span
            key={s.k}
            className="flex items-center gap-1.5 rounded-md border bg-background/60 px-2 py-1 text-xs text-muted-foreground"
          >
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
              {s.k}
            </kbd>
            {s.l}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: Undo2,
    title: "Undo everything",
    description:
      "Marked the wrong cell? One ⌘Z puts it back.",
  },
  {
    icon: Download,
    title: "Export your data",
    description:
      "Download everything as CSV or a formatted PDF report — your record, your files.",
  },
  {
    icon: WifiOff,
    title: "Offline-ready PWA",
    description:
      "Install it like an app. Status changes made without a connection sync when you're back online.",
  },
  {
    icon: Bell,
    title: "Daily reminders",
    description:
      "A configurable browser notification nudges you before the day's evidence goes unrecorded.",
  },
];

/** Cursor-following spotlight handler for bento cards. */
function trackSpotlight(
  e: React.MouseEvent<HTMLElement>,
  el: HTMLElement | null
) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--y", `${e.clientY - rect.top}px`);
}

/** Bento feature grid. */
export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          title={
            <>
              Built for consistency,
              <br className="hidden sm:block" /> not for busywork.
            </>
          }
          description="Four honest states for every day, real analytics, and shortcuts that make marking a day take seconds."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) * 0.08}
              className={cn(f.wide && "sm:col-span-2")}
            >
              <div
                onMouseMove={(e) =>
                  trackSpotlight(e, e.currentTarget as HTMLElement)
                }
                className="spotlight group relative h-full overflow-hidden lg rounded-[1.75rem] p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                {f.visual}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
