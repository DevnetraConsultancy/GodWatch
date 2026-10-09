import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsView } from "@/components/settings/settings-view";
import { getTasks, getStatuses, getUserSettings, resolveSessionUserId } from "@/lib/queries";
import { rangeISODates } from "@/lib/utils";
import { buildExportRows } from "@/lib/export-helpers";

export const metadata: Metadata = {
  title: "Settings · God Watch",
  description: "Manage your God Watch preferences and data.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = await resolveSessionUserId(session);

  const [settings, tasks, statuses] = await Promise.all([
    getUserSettings(userId),
    getTasks(userId),
    getStatuses(userId),
  ]);

  // Build export rows over the last 365 days.
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 364);
  const days = rangeISODates(start, today);
  const exportRows = buildExportRows(
    tasks,
    statuses as Record<string, Record<string, string>>,
    days
  );

  const viewSettings = settings
    ? {
        theme: settings.theme,
        dailyReminderEnabled: settings.dailyReminderEnabled,
        dailyReminderTime: settings.dailyReminderTime ?? "20:00",
        dailyReminderChannel: settings.dailyReminderChannel,
        defaultTaskColor: settings.defaultTaskColor,
      }
    : null;

  return (
    <SettingsView
      settings={viewSettings}
      hasData={exportRows.length > 0}
      exportRows={exportRows.map((r) => ({
        task: r.task,
        date: r.date,
        status: r.status,
      }))}
    />
  );
}

