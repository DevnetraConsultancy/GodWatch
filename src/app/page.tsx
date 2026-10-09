import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingNav } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { HabitMarquee } from "@/components/landing/habit-marquee";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AnalyticsShowcase } from "@/components/landing/analytics-showcase";
import { SocialProof } from "@/components/landing/social-proof";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: { absolute: "God Watch — Every Day Leaves Evidence" },
  description:
    "The date-first habit tracker that records whether each task was completed, failed, or missed — then turns that honesty into streaks, heatmaps, and long-term proof of consistency.",
  openGraph: {
    title: "God Watch — Every Day Leaves Evidence",
    description:
      "Track every day. Leave evidence. Streaks, heatmaps, and analytics from a status-cell engine built for consistency.",
    type: "website",
  },
};

/**
 * Root route — public landing page for guests.
 * Authenticated users go straight to the dashboard.
 */
export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <LandingNav />
      <main>
        <Hero />
        <HabitMarquee />
        <Features />
        <HowItWorks />
        <AnalyticsShowcase />
        <SocialProof />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
