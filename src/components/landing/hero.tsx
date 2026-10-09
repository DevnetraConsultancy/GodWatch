"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductMock } from "@/components/landing/product-mock";
import { APP_TAGLINE } from "@/lib/constants";

const STATS = [
  { value: "4", label: "status states per cell" },
  { value: "∞", label: "tasks & dates tracked" },
  { value: "12+", label: "analytics views" },
] as const;

const TRUST = [
  { icon: Keyboard, text: "Keyboard-first (1/2/3/0)" },
  { icon: ShieldCheck, text: "Private by default" },
  { icon: Sparkles, text: "Offline-ready PWA" },
] as const;

/** Hero: eyebrow, display headline, CTAs, trust row, and the animated product mock. */
export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
      {/* Backdrop layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-fade-center" />
        <div className="absolute -top-32 left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <div className="container">
        {/* Eyebrow pill */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex w-fit items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[9px] text-white">
            ★
          </span>
          {APP_TAGLINE}
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mx-auto mt-6 max-w-4xl text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Track every day.
          <br />
          <span className="text-gradient-gold">Leave evidence.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-center text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          God Watch is the date-first habit tracker that records whether each
          task was completed, failed, or missed — then turns that honesty into
          streaks, heatmaps, and long-term proof of consistency.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-7 text-base text-white shadow-lg shadow-amber-500/25 hover:from-amber-500/90 hover:to-orange-600/90"
          >
            <Link href="/login">
              Start tracking free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-7 text-base"
          >
            <a href="#how-it-works">See how it works</a>
          </Button>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.34 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
        >
          {TRUST.map((t) => (
            <span key={t.text} className="flex items-center gap-1.5">
              <t.icon className="h-3.5 w-3.5 text-success" />
              {t.text}
            </span>
          ))}
        </motion.div>

        {/* Product mock */}
        <div className="mt-14 sm:mt-16">
          <ProductMock />
        </div>

        {/* Stats */}
        <motion.dl
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x rounded-2xl border bg-card/60 backdrop-blur"
        >
          {STATS.map((s) => (
            <div key={s.label} className="px-4 py-5 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block text-2xl font-semibold tracking-tight sm:text-3xl">
                  {s.value}
                </span>
                <span className="mt-1 block text-[11px] leading-tight text-muted-foreground sm:text-xs">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
