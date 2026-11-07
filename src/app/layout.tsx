import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Fraunces, Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/features/pwa/pwa-register";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

// Two faces, Latin subsets only (self-hosted at build time by next/font):
// Geist carries the interface, Fraunces the wordmark, headlines and big numbers.
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: "variable",
  axes: ["SOFT", "opsz"],
});

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
  icons: {
    // favicon.ico in src/app is served automatically and listed first,
    // so browsers that cling to /favicon.ico also get the new logo.
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP_NAME },
  openGraph: { type: "website", siteName: APP_NAME, title, description: APP_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title, description: APP_DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${fraunces.variable}`}>
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
