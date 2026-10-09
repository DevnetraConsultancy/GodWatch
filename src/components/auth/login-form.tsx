"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X, Minus, Flame, ShieldCheck, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Icons } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

/** Live status-cell showcase used in the left brand panel. */
function CellShowcase() {
  // Each habit shows its last two days plus today (pending).
  const rows: { label: string; history: ("done" | "missed" | "failed")[] }[] = [
    { label: "Deep Work", history: ["done", "done"] },
    { label: "Workout", history: ["done", "failed"] },
    { label: "Read 20 pages", history: ["missed", "done"] },
    { label: "Meditate", history: ["failed", "done"] },
  ];

  const styles = {
    done: {
      cls: "bg-success/15 text-success ring-1 ring-success/30",
      icon: <Check className="h-4 w-4" />,
    },
    missed: {
      cls: "bg-warning/15 text-warning ring-1 ring-warning/30",
      icon: <Minus className="h-4 w-4" />,
    },
    failed: {
      cls: "bg-danger/15 text-danger ring-1 ring-danger/30",
      icon: <X className="h-4 w-4" />,
    },
  };

  return (
    <div className="w-full max-w-xs rounded-2xl border bg-card/70 p-4 shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="flex items-center justify-between pb-3">
        <span className="text-xs font-semibold">Thu · Oct 09</span>
        <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
          <Flame className="h-3 w-3" />
          42-day streak
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
              {r.label}
            </span>
            {r.history.map((state, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  styles[state].cls
                )}
              >
                {styles[state].icon}
              </span>
            ))}
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <span className="text-xs">·</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const reduced = useReducedMotion();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* ── Left: brand panel ─────────────────────────── */}
      <div className="relative hidden overflow-hidden border-r bg-card/40 lg:flex lg:flex-col lg:justify-between lg:p-10">
        {/* Backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid" />
          <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-500/10 to-amber-500/10 blur-3xl" />
        </div>

        {/* Brand */}
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 shadow-md shadow-amber-500/25">
            <Icons.logo className="h-5 w-5 text-white" />
          </span>            <span className="text-sm font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* Center content */}
        <div className="relative">
          <h2 className="max-w-md text-4xl font-semibold leading-[1.1] tracking-tight">
            Proof beats{" "}
            <span className="text-gradient-gold">motivation.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            A date-first habit tracker. Mark each day Completed, Failed, or
            Missed — and watch streaks, heatmaps, and analytics prove your
            consistency over time.
          </p>

          <div className="mt-8">
            <CellShowcase />
          </div>
        </div>

        {/* Bottom features */}
        <div className="relative flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5 text-success" />
            Keyboard-first
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Private by default
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-warning" />
            Streaks & heatmaps
          </span>
        </div>
      </div>

      {/* ── Right: form panel ─────────────────────────── */}
      <div className="relative flex flex-col">
        {/* Mobile backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-primary/5 lg:hidden"
        />

        {/* Top bar: brand (mobile) + back link */}
        <div className="flex items-center justify-between p-5">
          <Link href="/" className="flex items-center gap-2.5 lg:invisible">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 shadow-md shadow-amber-500/25">
              <Icons.logo className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to site
          </Link>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-5 py-8">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl border bg-card p-8 shadow-2xl shadow-black/5 backdrop-blur-xl">
              <div className="mb-8 flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/25">
                  <Icons.logo className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {APP_NAME}
                </h1>
                <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
              </div>

              <Button
                variant="outline"
                className="w-full gap-3 py-6 text-base shadow-sm transition-all hover:shadow-md"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <Icons.spinner className="h-5 w-5 animate-spin" />
                ) : (
                  <Icons.google className="h-5 w-5" />
                )}
                Continue with Google
              </Button>

              <div className="mt-6 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <span>
                  Google-only sign-in — no passwords stored. Your data stays
                  scoped to your account.
                </span>
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Every day leaves evidence. Track it.
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to use God Watch for personal tracking.
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="p-5 text-center text-xs text-muted-foreground">
          <p>Invented by Devnetra Consultancy</p>
        </footer>
      </div>
    </div>
  );
}
