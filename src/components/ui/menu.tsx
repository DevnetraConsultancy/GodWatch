"use client";

import * as React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Menu.Content>,
  React.ComponentPropsWithoutRef<typeof Menu.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <Menu.Portal>
    <Menu.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "glass-strong z-50 min-w-44 overflow-hidden rounded-md p-1 text-sm",
        "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
        className
      )}
      {...props}
    />
  </Menu.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, ref) => (
  <Menu.Item
    ref={ref}
    className={cn(
      "relative flex min-h-9 cursor-default select-none items-center gap-2 rounded-sm px-2 outline-none transition-colors",
      "data-[highlighted]:bg-accent-soft data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted",
      destructive && "text-danger data-[highlighted]:bg-danger-soft [&_svg]:text-danger",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof Menu.Label>) {
  return <Menu.Label className={cn("px-2 py-1.5 text-xs font-medium text-fg-muted", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof Menu.Separator>) {
  return <Menu.Separator className={cn("-mx-1 my-1 h-px bg-line", className)} {...props} />;
}
