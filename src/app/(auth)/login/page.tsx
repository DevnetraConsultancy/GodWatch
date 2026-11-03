import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertCircle, Check, Minus, X } from "lucide-react";
import { BrandLink } from "@/components/brand";
import { GoogleButton } from "@/features/auth/google-button";
import { signInWithGoogle } from "@/server/actions/account";
import { getCurrentUser } from "@/server/session";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${APP_NAME} with your Google account.`,
  alternates: { canonical: "/login" },
};

const ERRORS: Record<string, string> = {
  AccessDenied: "Sign-in was refused. Use a Google account with a verified email address.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in. Use the Google account you signed up with.",
  Configuration: "Sign-in is temporarily unavailable. Please try again in a few minutes.",
  Verification: "That sign-in link has expired. Please try again.",
};

function safeCallback(value: unknown): string {
  return typeof value === "string" && /^\/(?!\/)[\w\-/?=&.]*$/.test(value) ? value : "/dashboard";
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const callbackUrl = safeCallback(params.callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);

  const errorKey = typeof params.error === "string" ? params.error : null;
  const error = errorKey ? (ERRORS[errorKey] ?? "Sign-in failed. Please try again.") : null;

  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex" aria-hidden>
        <BrandLink />
        <div className="space-y-6">
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Proof beats <span className="text-gradient">motivation.</span>
          </h2>
          <p className="max-w-md text-fg-muted">
            Mark each day Completed, Failed or Missed, and let streaks, heatmaps and analytics show your consistency.
          </p>
          <div className="glass w-full max-w-xs space-y-2 rounded-lg p-4">
            {[
              { name: "Deep work", marks: ["done", "done"] },
              { name: "Workout", marks: ["done", "failed"] },
              { name: "Read", marks: ["missed", "done"] },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-2 text-xs">
                <span className="flex-1 font-medium text-fg-muted">{r.name}</span>
                {r.marks.map((m, i) => (
                  <span
                    key={i}
                    className={
                      m === "done"
                        ? "flex size-7 items-center justify-center rounded-md bg-success-soft text-success"
                        : m === "failed"
                          ? "flex size-7 items-center justify-center rounded-md bg-danger-soft text-danger"
                          : "flex size-7 items-center justify-center rounded-md bg-warning-soft text-warning"
                    }
                  >
                    {m === "done" ? <Check className="size-4" /> : m === "failed" ? <X className="size-4" /> : <Minus className="size-4" />}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-fg-subtle">{APP_TAGLINE}</p>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <div className="glass-strong w-full max-w-sm space-y-6 rounded-xl p-8">
          <div className="lg:hidden">
            <BrandLink />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to {APP_NAME}</h1>
            <p className="text-sm text-fg-muted">Use your Google account. No password to remember.</p>
          </div>
          {error && (
            <p role="alert" className="flex gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}
          <form action={signInWithGoogle}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <GoogleButton />
          </form>
          <p className="text-xs leading-relaxed text-fg-muted">
            By continuing you agree that we store your Google name, email and photo to run your account. Your habits are
            private to you.
          </p>
        </div>
      </section>
    </main>
  );
}
