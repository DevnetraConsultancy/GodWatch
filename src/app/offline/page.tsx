import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/ui/feedback";
import { BrandLink } from "@/components/brand";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main id="main" className="container-page flex min-h-dvh flex-col items-center justify-center gap-8">
      <BrandLink />
      <div className="glass w-full max-w-md rounded-xl">
        <EmptyState
          icon={WifiOff}
          title="You're offline"
          description="God Watch needs a connection to load and save your days. Reconnect and refresh this page."
        />
      </div>
    </main>
  );
}
