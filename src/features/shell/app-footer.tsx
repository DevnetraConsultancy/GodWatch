import { APP_CONTACT_EMAIL, APP_FOOTER, APP_TAGLINE } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="container-page hidden py-6 text-xs text-fg-muted md:flex md:items-center md:justify-between">
      <span>{APP_TAGLINE}</span>
      <span>
        {APP_FOOTER} ·{" "}
        <a className="underline-offset-4 hover:text-fg hover:underline" href={`mailto:${APP_CONTACT_EMAIL}`}>
          {APP_CONTACT_EMAIL}
        </a>
      </span>
    </footer>
  );
}
