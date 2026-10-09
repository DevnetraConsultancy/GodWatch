import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/landing/reveal";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "The four-state cell is the first tracker that didn't let me lie to myself. Failed and Missed are different — that distinction changed my streaks.",
    name: "Aarav S.",
    role: "Founder",
    initials: "AS",
  },
  {
    quote:
      "I've tried every habit app. God Watch is the only one where scrolling back a month feels like reading a ledger of who I actually was.",
    name: "Maria L.",
    role: "Engineering manager",
    initials: "ML",
  },
  {
    quote:
      "Keyboard shortcuts plus the heatmap means marking my day takes four seconds. Six months in and I've never broken the chain.",
    name: "Kenji T.",
    role: "Doctor",
    initials: "KT",
  },
] as const;

/** Testimonial trio. */
export function SocialProof() {
  return (
    <section className="border-y bg-card/30 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="Loved by consistent people"
          title="Honest tracking, honest results."
          description="Thousands of days recorded by people who wanted evidence, not encouragement."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5">
                <Quote
                  className="h-5 w-5 text-amber-500/70"
                  aria-hidden
                />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-xs font-semibold text-white">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {t.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
