"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/primitives";

const toastStyle: React.CSSProperties = {
  background: "var(--glass-strong)",
  color: "var(--fg)",
  border: "1px solid var(--glass-border)",
  boxShadow: "inset 0 1px 0 0 var(--glass-highlight), var(--glass-shadow-lg)",
  backdropFilter: "blur(28px) saturate(170%)",
  borderRadius: 16,
  fontFamily: "var(--font-sans)",
};

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      closeButton
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      // Keep toasts above the mobile tab bar.
      offset={{ bottom: 88 }}
      mobileOffset={{ bottom: 88 }}
      toastOptions={{
        style: toastStyle,
        classNames: {
          description: "!text-fg-muted",
          actionButton: "!bg-accent !text-accent-fg !font-medium",
        },
      }}
    />
  );
}

export function Providers({ nonce, children }: { nonce?: string; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange nonce={nonce}>
      <TooltipProvider delayDuration={300}>
        {children}
        <ThemedToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
