"use client";

import * as React from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePush } from "@/features/push/use-push";

/**
 * Hard ask on the dashboard: while this device hasn't granted notification
 * permission, a strip keeps asking. It disappears once alerts are on (or
 * blocked, or unsupported) - Chrome only shows its native prompt from a
 * user gesture, so the button is the way to trigger it.
 */
export function PushBanner() {
  const { state, enable } = usePush();
  const [clicked, setClicked] = React.useState(false);
  // Hidden during the initial probe (so devices already alerting see nothing),
  // but kept visible for the busy spell after a click.
  if (state !== "off" && !(state === "busy" && clicked)) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-accent-soft px-4 py-2.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <BellRing className="size-4 shrink-0 text-accent-text" aria-hidden />
        <p className="truncate text-sm text-fg">
          <span className="font-medium">Turn on habit alerts.</span>{" "}
          <span className="text-fg-muted">This device gets a notification when a timed habit starts.</span>
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => {
          setClicked(true);
          void enable();
        }}
        disabled={state === "busy"}
      >
        Enable
      </Button>
    </div>
  );
}
