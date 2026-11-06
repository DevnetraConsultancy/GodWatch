import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarRange,
  ChevronDown,
  Download,
  Flame,
  Keyboard,
  MousePointerClick,
  ShieldCheck,
  StickyNote,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLink } from "@/components/brand";
import { ProductPreview } from "@/features/landing/product-preview";
import { APP_CONTACT_EMAIL, APP_FOOTER, APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="container-page flex h-14 items-center justify-between">
        <BrandLink />
        <nav aria-label="Main" className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <a href="#features">Features</a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <a href="#faq">FAQ</a>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="container-page grid items-center gap-12 pb-16 pt-16 sm:pt-24 lg:grid-cols-[1fr_1.15fr] lg:pb-24">
      {/* No entrance animation here: this text is the page's largest paint. */}
      <div className="space-y-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
          <ShieldCheck className="size-3.5" aria-hidden /> {APP_TAGLINE}
        </p>
        <h1 className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          Track every day. <span className="text-gradient">Leave evidence.</span>
        </h1>
        <p className="max-w-xl text-pretty text-lg leading-relaxed text-fg-muted">
          {APP_NAME} is a date-first habit tracker. Record whether each habit was completed, failed or missed, then
          watch honest streaks, heatmaps and trends prove your consistency.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Start tracking free <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
          {[
            { icon: Keyboard, text: "Keyboard-first" },
            { icon: ShieldCheck, text: "Private by default" },
            { icon: Download, text: "Export any time" },
          ].map((t) => (
            <li key={t.text} className="flex items-center gap-1.5">
              <t.icon className="size-4 text-success" aria-hidden /> {t.text}
            </li>
          ))}
        </ul>
      </div>
      <ProductPreview className="animate-rise [animation-delay:120ms]" />
    </section>
  );
}

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: CalendarRange, title: "Date-first grid", text: "Today on top, every day a row of evidence, months of history one scroll away." },
  { icon: MousePointerClick, title: "One click per day", text: "Click a cell to cycle Pending, Completed, Failed, Missed. It saves instantly." },
  { icon: Undo2, title: "Undo anything", text: "Marked the wrong cell? Undo from the toast or press Ctrl Z." },
  { icon: Flame, title: "Fair streaks", text: "A habit only counts from the day you start it, so adding one never rewrites your past." },
  { icon: BarChart3, title: "Real analytics", text: "7, 30 and 365-day rates, a year heatmap, best and toughest months, per-habit breakdowns." },
  { icon: StickyNote, title: "Daily notes", text: "Write what helped or got in the way. Notes autosave and are searchable." },
  { icon: Keyboard, title: "Keyboard-first", text: "Arrow keys to move, 1 / 2 / 3 / 0 to mark, Ctrl K to search everything." },
  { icon: Bell, title: "Daily reminders", text: "An optional browser notification at the time you choose." },
  { icon: Download, title: "Your data, your files", text: "Export the last year as CSV or a clean PDF report whenever you like." },
];

export function Features() {
  return (
    <section id="features" className="container-page scroll-mt-24 py-16 lg:py-24">
      <SectionHeading eyebrow="Features" title="Everything you need to stay honest" text="Built for people who want proof, not motivation." />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="glass rounded-lg p-6 transition-transform duration-200 hover:-translate-y-0.5">
            <span className="flex size-10 items-center justify-center rounded-md bg-accent-soft text-accent-text">
              <f.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{f.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = [
  { title: "Add your habits", text: "Each habit becomes a column. Give it a name and a colour." },
  { title: "Mark the day", text: "Completed, Failed or Missed. Failed means you tried; Missed means the day slipped by." },
  { title: "Watch evidence compound", text: "Streaks, heatmaps and trends turn your daily marks into long-term proof." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container-page scroll-mt-24 py-16 lg:py-24">
      <SectionHeading eyebrow="How it works" title="Three steps, every day" />
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="glass rounded-lg p-6">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg">{i + 1}</span>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const FAQ = [
  {
    q: `How is ${APP_NAME} different from a to-do list?`,
    a: "To-do lists are task-first and forget the past. God Watch is date-first: every day is a row and every habit-day cell carries one of four states. That structure is what makes streaks, heatmaps and true completion rates possible.",
  },
  {
    q: "What do Failed and Missed mean?",
    a: "Failed means you attempted the habit and it didn't happen. Missed means the day passed without an attempt. Keeping them apart is deliberate: one is feedback, the other is a gap in the record.",
  },
  { q: "What counts as today?", a: "Your own day, midnight to midnight in your timezone, detected from your browser." },
  {
    q: "Does it work offline?",
    a: "You can install it as an app, but it needs a connection to load and save. Your private data is never stored in the browser cache.",
  },
  { q: "Can I get my data out?", a: "Any time. Export the last 365 days as CSV or a PDF report from Settings." },
  { q: "Is it free?", a: "Yes. Sign in with Google and start tracking." },
];

export function Faq() {
  return (
    <section id="faq" className="container-page max-w-3xl scroll-mt-24 py-16 lg:py-24">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <div className="mt-10 space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="glass group rounded-lg">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg p-5 font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-fg-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="container-page py-16 lg:py-24">
      <div className="glass-strong rounded-xl px-6 py-14 text-center">
        <h2 className="font-display mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Start leaving evidence today</h2>
        <p className="mx-auto mt-3 max-w-xl text-fg-muted">One click per habit per day. The record does the rest.</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/login">
            Start tracking free <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="container-page flex flex-col items-center justify-between gap-4 border-t py-8 text-sm text-fg-muted sm:flex-row">
      <BrandLink />
      <p>
        {APP_FOOTER} ·{" "}
        <a className="underline-offset-4 hover:text-fg hover:underline" href={`mailto:${APP_CONTACT_EMAIL}`}>
          {APP_CONTACT_EMAIL}
        </a>
      </p>
    </footer>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-accent-text">{eyebrow}</p>
      <h2 className="font-display mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-fg-muted">{text}</p>}
    </div>
  );
}
