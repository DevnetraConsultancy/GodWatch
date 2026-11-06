import { Credit } from "@/components/brand";
import { APP_TAGLINE } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="container-page hidden py-6 text-xs text-fg-muted md:flex md:items-center md:justify-between md:gap-4">
      <span>{APP_TAGLINE}</span>
      <Credit />
    </footer>
  );
}
