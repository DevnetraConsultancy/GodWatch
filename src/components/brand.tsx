import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** God Watch mark: an eye inside a rounded square ("every day is watched"). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <defs>
        <linearGradient id="gw-mark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#161616" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="gw-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6dd96" />
          <stop offset="1" stopColor="#c3902b" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#gw-mark)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="url(#gw-gold)" strokeOpacity="0.8" />
      <path d="M6 16c2.6-4.6 6-7 10-7s7.4 2.4 10 7c-2.6 4.6-6 7-10 7s-7.4-2.4-10-7Z" fill="none" stroke="url(#gw-gold)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="3.2" fill="url(#gw-gold)" />
    </svg>
  );
}

export function BrandLink({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-md", className)} aria-label={`${APP_NAME} home`}>
      <LogoMark />
      <span className="font-display text-base font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
