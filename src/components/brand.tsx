import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** God Watch mark: an eye inside a rounded square ("every day is watched"). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <defs>
        <linearGradient id="gw-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#gw-mark)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="white" strokeOpacity="0.25" />
      <path d="M6 16c2.6-4.6 6-7 10-7s7.4 2.4 10 7c-2.6 4.6-6 7-10 7s-7.4-2.4-10-7Z" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="3.2" fill="white" />
    </svg>
  );
}

export function BrandLink({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-md", className)} aria-label={`${APP_NAME} home`}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
