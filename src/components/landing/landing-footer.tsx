import Link from "next/link";
import { Icons } from "@/components/shared/icons";
import { APP_NAME, APP_TAGLINE, APP_FOOTER, APP_CONTACT_EMAIL } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Analytics", href: "#analytics" },
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Open dashboard", href: "/dashboard" },
    ],
  },
] as const;

/** Marketing site footer. */
export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/30">
      <div className="container py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 shadow-md shadow-amber-500/25">
                <Icons.logo className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-semibold tracking-tight">
                {APP_NAME}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {APP_TAGLINE} A date-first habit tracker that turns daily
              honesty into long-term proof.
            </p>
            <a
              href={`mailto:${APP_CONTACT_EMAIL}`}
              className="mt-4 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {APP_CONTACT_EMAIL}
            </a>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} {APP_FOOTER}. All rights reserved.
          </p>
          <p className="font-medium italic">“{APP_TAGLINE}”</p>
        </div>
      </div>
    </footer>
  );
}
