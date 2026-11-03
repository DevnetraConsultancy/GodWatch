"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page pt-10">
      <div className="glass mx-auto max-w-lg rounded-xl">
        <ErrorState
          description={
            <>
              This page failed to load. Your saved data is safe.
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
    </div>
  );
}
