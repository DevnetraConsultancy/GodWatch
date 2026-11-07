import Link from "next/link";
import { Heart, Mail } from "lucide-react";
import { APP_CONTACT_EMAIL, APP_FOOTER_COMPANY, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * GodWatch mark: the gold eye ("every day is watched") in a small black tile
 * with a gold ring, so it reads the same on light and dark backgrounds.
 * The same artwork is used for the favicon and PWA icons.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[22%] bg-black",
        "ring-1 ring-accent/45 shadow-[0_2px_8px_-2px_rgba(233,189,80,0.45)]",
        className
      )}
    >
      {/* Plain <img>: a tiny static asset, nothing for next/image to optimise. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.webp" alt="" draggable={false} width={640} height={640} className="h-full w-full select-none object-cover" />
    </span>
  );
}

export function BrandLink({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label={`${APP_NAME} home`}>
      <LogoMark />
      {/* Wordmark: "GodWatch" as one word, "God" in the page's foreground (white on dark) and "Watch" in gold. */}
      <span className="font-display text-lg font-bold tracking-tight text-fg [font-variation-settings:'SOFT'_60]">
        God<span className="text-gradient">Watch</span>
      </span>
    </Link>
  );
}

/** Company credit line with contact, shared by every footer. */
export function Credit({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-1.5 gap-y-1", className)}>
      <span className="inline-flex items-center gap-1.5">
        Invented with
        <Heart className="size-3.5 fill-[#e3342f] text-[#e3342f]" aria-hidden />
        <span className="sr-only">love</span>
        by
      </span>
      <span className="whitespace-nowrap font-medium text-fg">{APP_FOOTER_COMPANY}</span>
      <a
        className="ml-1 inline-flex items-center gap-1 underline-offset-4 hover:text-fg hover:underline"
        href={`mailto:${APP_CONTACT_EMAIL}`}
      >
        <Mail className="size-3.5" aria-hidden />
        {APP_CONTACT_EMAIL}
      </a>
    </span>
  );
}
