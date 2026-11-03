import type { Metadata } from "next";
import { AppHeader, MobileNav } from "@/features/shell/app-header";
import { ClientServices } from "@/features/shell/client-services";
import { requirePageUser } from "@/server/session";
import { AppFooter } from "@/features/shell/app-footer";
import { TooltipProvider } from "@/components/ui/primitives";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Shell for every signed-in page. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-dvh flex-col">
        <AppHeader user={{ name: user.name, email: user.email, image: user.image }} />
        <main id="main" className="flex-1 pb-24 md:pb-8">
          {children}
        </main>
        <AppFooter />
        <MobileNav />
        <ClientServices
          timeZone={user.timeZone}
          reminder={{ enabled: user.settings.dailyReminderEnabled, time: user.settings.dailyReminderTime }}
        />
      </div>
    </TooltipProvider>
  );
}
