"use client";

import { useEffect } from "react";
import { APP_NAME } from "@/lib/constants";

const LAST_FIRED_KEY = "gw-reminder-last";

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Milliseconds until the next HH:mm in the browser's local time. */
export function msUntil(time: string, now: Date = new Date()): number {
  const [h = 20, m = 0] = time.split(":").map(Number);
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function notify(): Promise<void> {
  const title = `${APP_NAME}: time to check in`;
  const options: NotificationOptions = {
    body: "Mark today's habits before the day ends.",
    icon: "/icons/icon-192.png",
    tag: "gw-daily-reminder",
  };
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) await registration.showNotification(title, options);
  else new Notification(title, options);
}

/**
 * Browser reminder at the user's chosen time. It fires only while the app is
 * open in a tab or installed and running; it is not a server push.
 */
export function useDailyReminder(enabled: boolean, time: string): void {
  useEffect(() => {
    if (!enabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(() => {
        const today = localDateKey(new Date());
        let last: string | null = null;
        try {
          last = localStorage.getItem(LAST_FIRED_KEY);
          localStorage.setItem(LAST_FIRED_KEY, today);
        } catch {
          // Storage can be unavailable (private mode); a duplicate reminder is harmless.
        }
        if (last !== today) void notify().catch(() => {});
        schedule();
      }, msUntil(time));
    };

    schedule();
    return () => clearTimeout(timer);
  }, [enabled, time]);
}
