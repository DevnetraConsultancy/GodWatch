import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { APP_FOOTER, APP_CONTACT_EMAIL } from "@/lib/constants";

/** Final conversion band. */
export function FinalCTA() {
  return (
    <section className="border-t py-24 sm:py-32">
      <div className="container">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-amber-500/5 px-6 py-14 text-center shadow-xl shadow-black/5 sm:px-12 sm:py-16">
            {/* Backdrop */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-center"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-3xl"
            />

            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Today is already leaving{" "}
              <span className="text-gradient-gold">evidence.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
              Start recording it in under a minute. Sign in with Google, add
              your first habit, and mark your first day.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 text-base text-white shadow-lg shadow-amber-500/25 hover:from-amber-500/90 hover:to-orange-600/90"
              >
                <Link href="/login">
                  Start tracking free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <a
                href={`mailto:${APP_CONTACT_EMAIL}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Questions? {APP_CONTACT_EMAIL}
              </a>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Free · No credit card · {APP_FOOTER}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
