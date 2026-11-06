"use client";

import dynamic from "next/dynamic";
import { ThemeProvider, useTheme } from "next-themes";

// Toasts only follow user actions, so the toaster loads after first paint
// instead of shipping with every page's critical JavaScript.
const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

const toastStyle: React.CSSProperties = {
  background: "var(--glass-strong)",
  color: "var(--fg)",
  boxShadow: "inset 0 1px 0 0 var(--glass-highlight), var(--glass-shadow-lg)",
  backdropFilter: "blur(28px) saturate(170%)",
  borderRadius: 0,
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
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
