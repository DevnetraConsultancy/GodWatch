"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/primitives";

export function Providers({ nonce, children }: { nonce?: string; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange nonce={nonce}>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          toastOptions={{
            classNames: {
              toast: "glass-strong !rounded-lg !border-glass-border !text-fg !font-sans",
              description: "!text-fg-muted",
              actionButton: "!bg-accent !text-accent-fg !font-medium",
              cancelButton: "!bg-glass-hover !text-fg",
              closeButton: "!bg-glass-strong !border-glass-border !text-fg-muted",
            },
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
