"use client";

import Link from "next/link";
import { Keyboard, LogOut, Settings, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { signOutUser } from "@/server/actions/account";
import { openShortcuts } from "@/features/shell/shortcuts-dialog";

export function UserMenu({ user }: { user: { name: string; email: string; image: string | null } }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="ml-1 rounded-full transition-opacity hover:opacity-90"
        aria-label={`Account menu for ${user.name}`}
      >
        <Avatar name={user.name} image={user.image} size={34} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="truncate text-sm font-semibold text-fg">{user.name}</span>
          <span className="truncate font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound aria-hidden /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openShortcuts()}>
          <Keyboard aria-hidden /> Keyboard shortcuts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => void signOutUser()}>
          <LogOut aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
