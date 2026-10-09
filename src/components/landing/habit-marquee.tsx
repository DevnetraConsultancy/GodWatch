import { Repeat } from "lucide-react";

const HABITS = [
  "Morning workout",
  "Deep work 2h",
  "Read 20 pages",
  "Meditate",
  "No sugar",
  "Cold shower",
  "Journal",
  "Sleep by 11pm",
  "Walk 8k steps",
  "Practice guitar",
  "Drink 3L water",
  "No social media",
] as const;

/** Infinite scrolling habit ticker — signals "any habit, any day". */
export function HabitMarquee() {
  const row = [...HABITS, ...HABITS];

  return (
    <section
      aria-label="Habits you can track"
      className="relative border-y bg-card/40 py-5"
    >
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-3 hover:[animation-play-state:paused]">
          {row.map((habit, i) => (
            <span
              key={`${habit}-${i}`}
              className="flex shrink-0 items-center gap-2 rounded-full border bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur"
            >
              <Repeat className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              {habit}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
