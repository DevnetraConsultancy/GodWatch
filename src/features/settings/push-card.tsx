"use client";

import { BellRing } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/field";
import { Switch } from "@/components/ui/primitives";
import { usePush } from "@/features/push/use-push";

/** Per-device opt-in for server pushes when a timed habit starts. */
export function PushCard() {
  const { state, enable, disable } = usePush();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BellRing className="size-4 text-accent-text" aria-hidden /> Habit start alerts
        </CardTitle>
        <CardDescription>
          A notification on this device when a timed habit begins, even while the site is closed. Turn it on
          separately on each device. On iPhone, install the app to the home screen first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="push-enabled">Alert this device</Label>
            {state === "denied" && (
              <p className="text-xs text-danger">Notifications are blocked for this site in your browser settings.</p>
            )}
            {state === "unsupported" && (
              <p className="text-xs text-fg-muted">This browser doesn&apos;t support push notifications.</p>
            )}
          </div>
          <Switch
            id="push-enabled"
            checked={state === "on"}
            disabled={state === "busy" || state === "denied" || state === "unsupported"}
            onCheckedChange={(v) => void (v ? enable() : disable())}
          />
        </div>
      </CardContent>
    </Card>
  );
}
