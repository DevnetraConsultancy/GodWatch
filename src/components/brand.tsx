import Link from "next/link";
import { Heart, Mail } from "lucide-react";
import { APP_CONTACT_EMAIL, APP_FOOTER_COMPANY, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** God Watch mark: the gold eye medallion ("every day is watched"). One vector source for header, favicon and PWA icons. */
export function LogoMark({ className }: { className?: string }) {
  // Plain <img>: the asset is a static SVG, so next/image optimisation has nothing to do.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="" aria-hidden width={512} height={320} className={cn("h-7 w-auto shrink-0", className)} />;
}

export function BrandLink({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label={`${APP_NAME} home`}>
      <LogoMark />
      <span className="text-gradient font-display text-lg font-bold tracking-tight [font-variation-settings:'SOFT'_60]">
        {APP_NAME}
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
