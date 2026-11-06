"use client";

import * as React from "react";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/field";
import { Switch } from "@/components/ui/primitives";
import { removePushSubscription, savePushSubscription } from "@/server/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function base64ToUint8(base64: string): Uint8Array {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "unsupported" | "denied" | "off" | "on" | "busy";

/** Per-device opt-in for server pushes when a timed habit starts. */
export function PushCard() {
  const [state, setState] = React.useState<State>("busy");

  React.useEffect(() => {
    if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  const enable = async () => {
    setState("busy");
    try {
      if ((await Notification.requestPermission()) !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8(VAPID_PUBLIC_KEY!) as BufferSource,
      });
      const json = sub.toJSON();
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });
      if (!res.ok) throw new Error(res.error);
      setState("on");
      toast.success("This device will get habit alerts");
    } catch {
      toast.error("Couldn't turn on alerts on this device");
      setState("off");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setState("off");
      toast("Habit alerts are off on this device");
    } catch {
      toast.error("Couldn't turn off alerts");
      setState("on");
    }
  };

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
