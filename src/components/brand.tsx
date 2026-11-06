import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** God Watch mark: a gold eye inside viewfinder brackets ("every day is watched"). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 180" aria-hidden className={cn("size-8", className)}>
      <defs>
        <linearGradient id="gw-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F9D56A" />
          <stop offset="1" stopColor="#D99A22" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="164" height="164" rx="34" fill="#101010" stroke="#3A301B" strokeWidth="2" />
      <g fill="none" stroke="url(#gw-gold)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M48 58V45Q48 31 63 31H78M98 31H113Q128 31 128 45V58M48 122V135Q48 149 63 149H78M98 149H113Q128 149 128 135V122" />
        <path d="M31 90Q90 35 149 90Q90 145 31 90Z" strokeWidth="8" />
      </g>
      <circle cx="90" cy="90" r="17" fill="url(#gw-gold)" />
    </svg>
  );
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
