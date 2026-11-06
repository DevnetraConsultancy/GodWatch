"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { syncTimeZone } from "@/server/actions/account";
import { SearchDialog } from "@/features/search/search-dialog";
import { useDailyReminder } from "@/features/reminders/use-daily-reminder";

/** Background services for signed-in pages. */
export function ClientServices({
  timeZone,
  reminder,
}: {
  timeZone: string;
  reminder: { enabled: boolean; time: string };
}) {
  const router = useRouter();

  // Keep the stored timezone equal to the browser's, so "today" is the user's own day.
  React.useEffect(() => {
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserZone || browserZone === timeZone) return;
    void syncTimeZone({ timeZone: browserZone }).then((res) => {
      if (res.ok && res.data.changed) router.refresh();
    });
  }, [timeZone, router]);

  useDailyReminder(reminder.enabled, reminder.time);

  return <SearchDialog />;
}
