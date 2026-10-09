"use client";

import { useEffect } from "react";
import { useOfflineStore } from "@/store/offline-store";

/** Track navigator online/offline state and reflect it in the offline store. */
export function useOnlineStatus() {
  const setIsOnline = useOfflineStore((s) => s.setIsOnline);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);
}

