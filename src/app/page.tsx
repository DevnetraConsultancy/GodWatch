import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Faq, Features, FinalCta, Hero, HowItWorks, LandingFooter, LandingNav } from "@/features/landing/sections";
import { getCurrentUser } from "@/server/session";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME} | ${APP_TAGLINE}` },
  alternates: { canonical: "/" },
};

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <>
      <LandingNav />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
