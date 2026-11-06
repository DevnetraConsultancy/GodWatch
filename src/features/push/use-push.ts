"use client";

import * as React from "react";
import { toast } from "sonner";
import { removePushSubscription, savePushSubscription } from "@/server/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function base64ToUint8(base64: string): Uint8Array {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function subscribeAndSave(reg: ServiceWorkerRegistration): Promise<boolean> {
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ToUint8(VAPID_PUBLIC_KEY!) as BufferSource,
  });
  const json = sub.toJSON();
  const res = await savePushSubscription({
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
  });
  return res.ok;
}

export type PushState = "unsupported" | "denied" | "off" | "on" | "busy";

/**
 * Per-device push opt-in. On mount, a device whose permission is already
 * granted is (re)subscribed silently, so every signed-in device registers
 * itself; `enable` asks for permission (the browser prompt) and subscribes.
 */
export function usePush() {
  const [state, setState] = React.useState<PushState>("busy");

  React.useEffect(() => {
    if (
      !VAPID_PUBLIC_KEY ||
      typeof Notification === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    let cancelled = false;
    void navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) return true;
        // Permission granted earlier (perhaps on another visit): register
        // this device without any prompt.
        if (Notification.permission === "granted") return subscribeAndSave(reg);
        return false;
      })
      .then((on) => !cancelled && setState(on ? "on" : "off"))
      .catch(() => !cancelled && setState("off"));
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = React.useCallback(async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        toast.error(
          permission === "denied"
            ? "Notifications are blocked for this site. Allow them in the browser's site settings."
            : "The permission prompt was dismissed"
        );
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      if (!(await subscribeAndSave(reg))) throw new Error("save failed");
      setState("on");
      toast.success("This device will get habit alerts");
    } catch {
      toast.error("Couldn't turn on alerts on this device");
      setState("off");
    }
  }, []);

  const disable = React.useCallback(async () => {
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
  }, []);

  return { state, enable, disable };
}
