"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="container-page flex min-h-dvh items-center justify-center">
      <div className="glass w-full max-w-lg rounded-xl">
        <ErrorState
          description={
            <>
              Something broke while loading this page.
              {error.digest && <span className="mt-1 block font-mono text-xs">Reference: {error.digest}</span>}
            </>
          }
          action={
            <Button onClick={reset}>
              <RotateCcw aria-hidden /> Try again
            </Button>
          }
        />
      </div>
    </main>
  );
}
