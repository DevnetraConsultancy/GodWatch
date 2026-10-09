import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileView } from "@/components/profile/profile-view";
import {
  getRecentActivity,
  getUserAchievements,
  getUserStats,
  resolveSessionUserId,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your profile, stats, and achievements.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = await resolveSessionUserId(session);

  const [stats, achievements, recentActivity] = await Promise.all([
    getUserStats(userId),
    getUserAchievements(userId),
    getRecentActivity(userId, 15),
  ]);

  return (
    <ProfileView
      user={{
        name: session.user.name ?? "God Watcher",
        email: session.user.email ?? "",
        image: session.user.image ?? undefined,
      }}
      joinedAt={new Date().toISOString()}
      stats={stats}
      achievements={achievements}
      recentActivity={recentActivity}
    />
  );
}

