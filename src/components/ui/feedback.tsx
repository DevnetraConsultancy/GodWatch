import * as React from "react";
import { AlertTriangle, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--line)_25%,var(--glass-hover)_50%,var(--line)_75%)] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      <span className="glass flex size-12 items-center justify-center rounded-lg text-accent-text">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Please try again.",
  action,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-lg bg-danger-soft text-danger">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-fg-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "accent" | "success" | "danger" | "warning" }) {
  const tones = {
    neutral: "bg-glass-hover text-fg-muted",
    accent: "bg-accent-soft text-accent-text",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
  } as const;
  return (
    <span
      className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium [&_svg]:size-3.5", tones[tone], className)}
      {...props}
    />
  );
}

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-line bg-field px-1.5 font-mono text-xs font-medium text-fg-muted",
        className
      )}
      {...props}
    />
  );
}
