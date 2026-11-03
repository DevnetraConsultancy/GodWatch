import type { Metadata } from "next";
import { SettingsView } from "@/features/settings/settings-view";
import { getTasks } from "@/server/data";
import { requirePageUser } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requirePageUser();
  const tasks = await getTasks(user.id, { includeArchived: true });
  return (
    <SettingsView
      settings={user.settings}
      timeZone={user.timeZone}
      archived={tasks.filter((t) => t.archivedOn !== null)}
      hasHabits={tasks.length > 0}
    />
  );
}
