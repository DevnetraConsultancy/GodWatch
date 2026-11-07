import { AlertCircle } from "lucide-react";
import { GoogleButton } from "@/features/auth/google-button";
import { signInWithGoogle } from "@/server/actions/account";
import { cn } from "@/lib/utils";

/** Messages for the `?error=` codes Auth.js sends back to the landing page. */
const SIGN_IN_ERRORS: Record<string, string> = {
  AccessDenied: "Sign-in was refused. Use a Google account with a verified email address.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in. Use the Google account you signed up with.",
  Configuration: "Sign-in is temporarily unavailable. Please try again in a few minutes.",
  Verification: "That sign-in link has expired. Please try again.",
};

export function signInErrorMessage(code: unknown): string | null {
  if (typeof code !== "string" || !code) return null;
  return SIGN_IN_ERRORS[code] ?? "Sign-in failed. Please try again.";
}

/** Same-origin paths only, to prevent open redirects. */
export function safeCallbackUrl(value: unknown): string {
  return typeof value === "string" && /^\/(?!\/)[\w\-/?=&.]*$/.test(value) ? value : "/dashboard";
}

/** The one way in: a Google sign-in form that lands on `callbackUrl` afterwards. */
export function GoogleSignIn({
  callbackUrl = "/dashboard",
  error,
  className,
}: {
  callbackUrl?: string;
  error?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {error && (
        <p role="alert" className="flex max-w-md gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      <form action={signInWithGoogle}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <GoogleButton />
      </form>
    </div>
  );
}
