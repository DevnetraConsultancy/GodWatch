import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeCallbackUrl, signInErrorMessage } from "@/features/auth/google-sign-in";
import { Faq, Features, FinalCta, Hero, HowItWorks, LandingFooter, LandingNav } from "@/features/landing/sections";
import { getCurrentUser } from "@/server/session";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME} | ${APP_TAGLINE}` },
  alternates: { canonical: "/" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  // Protected pages and Auth.js send people here with ?callbackUrl= and ?error=.
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);
  const error = signInErrorMessage(params.error);
  return (
    <>
      <LandingNav />
      <main id="main">
        <Hero callbackUrl={callbackUrl} error={error} />
        <Features />
        <HowItWorks />
        <Faq />
        <FinalCta callbackUrl={callbackUrl} />
      </main>
      <LandingFooter />
    </>
  );
}
