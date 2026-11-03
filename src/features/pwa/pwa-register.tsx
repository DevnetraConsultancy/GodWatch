"use client";

import { useEffect } from "react";

/** Register the service worker in production builds only. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.warn("[pwa] service worker registration failed", error);
    });
  }, []);
  return null;
}
