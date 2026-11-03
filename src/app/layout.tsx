import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/features/pwa/pwa-register";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

// One font, Latin subset only (self-hosted at build time by next/font).
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });

const siteUrl =process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const title = `${APP_NAME} | ${APP_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: "Devnetra Consultancy" }],
  keywords: ["habit tracker", "daily checklist", "streaks", "consistency", "productivity"],
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP_NAME },
  openGraph: { type: "website", siteName: APP_NAME, title, description: APP_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title, description: APP_DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f9" },
    { media: "(prefers-color-scheme: dark)", color: "#07080f" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning className={geistSans.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          Skip to content
        </a>
        <Providers nonce={nonce}>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
