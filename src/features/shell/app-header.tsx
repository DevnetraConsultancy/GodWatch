"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarCheck2, Settings, UserRound, type LucideIcon } from "lucide-react";
import { BrandLink } from "@/components/brand";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/features/shell/theme-toggle";
import { UserMenu } from "@/features/shell/user-menu";
import { SearchTrigger } from "@/features/search/search-dialog";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Today", icon: CalendarCheck2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader({ user }: { user: { name: string; email: string; image: string | null } }) {
  const isActive = useIsActive();
  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3">
      <div className="glass container-page flex h-14 items-center gap-3 rounded-lg !px-3 sm:!px-4">
        <BrandLink href="/dashboard" />
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-glass-hover hover:text-fg",
                "aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-text"
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <SearchTrigger />
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar for phones. */
export function MobileNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Main"
      className="glass-strong fixed inset-x-2 bottom-2 z-40 grid grid-cols-4 rounded-lg p-1 pb-[max(4px,env(safe-area-inset-bottom))] md:hidden"
    >
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className="flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-fg-muted transition-colors aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-text"
        >
          <item.icon className="size-5" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
