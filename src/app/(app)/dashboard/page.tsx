import type { Metadata } from "next";
import { GridView } from "@/features/grid/grid-view";
import { PushBanner } from "@/features/push/push-banner";
import { getDashboardData } from "@/server/data";
import { requirePageUser } from "@/server/session";
import { isISODate } from "@/lib/dates";
import { idSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Today" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePageUser();
  const params = await searchParams;
  const data = await getDashboardData(user.id, user.today);

  const date = typeof params.date === "string" && isISODate(params.date) && params.date <= user.today ? params.date : undefined;
  const habit = typeof params.habit === "string" && idSchema.safeParse(params.habit).success ? params.habit : undefined;

  return (
    <>
      <PushBanner />
      <GridView
      // Re-mount when the user's day changes (e.g. after a timezone sync at midnight).
      key={user.today}
      today={user.today}
      tasks={data.tasks}
      statuses={data.statuses}
      noteDates={data.noteDates}
      summary={data.summary}
      archivedCount={data.archivedCount}
      focusDate={date}
      focusHabit={habit}
        openNote={params.note === "1"}
      />
    </>
  );
}
