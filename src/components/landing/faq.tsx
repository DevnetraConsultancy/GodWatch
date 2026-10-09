"use client";

import * as React from "react";
import { Plus, Minus } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How is God Watch different from a normal to-do list?",
    a: "To-do lists are task-first and forget the past. God Watch is date-first: every day is a column, and every task×date cell carries one of four states — Pending, Completed, Failed, or Missed. That structure is what makes streaks, heatmaps, and true completion rates possible.",
  },
  {
    q: "What do Failed and Missed mean?",
    a: "Failed means you attempted the task and it didn't go through — you marked it and it didn't happen. Missed means the day passed without an attempt. Keeping them apart is deliberate: one is feedback, the other is a gap in the record.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. God Watch is an installable PWA with a service worker. Actions are queued locally and sync when you're back online, so your evidence never depends on a connection.",
  },
  {
    q: "Can I get my data out?",
    a: "Any time. Export the full record as CSV or a formatted PDF report from Settings. Your data belongs to you — every query is scoped to your account.",
  },
  {
    q: "Is it free?",
    a: "Yes — sign in with Google and start tracking. No credit card, no trial countdown.",
  },
  {
    q: "Which shortcuts can I use?",
    a: "1 marks Completed, 2 Failed, 3 Missed, 0 Pending. ⌘K opens global search, ⌘Z undoes your last action, and arrow keys navigate the grid.",
  },
] as const;

/** FAQ accordion — one item open at a time, fully keyboard accessible. */
export function FAQ() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered."
          description="Everything you need to know before you start leaving evidence."
        />

        <Reveal className="mx-auto mt-12 max-w-3xl">
          <div className="divide-y rounded-2xl border bg-card">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/50 sm:px-6"
                  >
                    <span className="text-sm font-medium sm:text-base">
                      {f.q}
                    </span>
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isOpen
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      )}
                      aria-hidden
                    >
                      {isOpen ? (
                        <Minus className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>

                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
