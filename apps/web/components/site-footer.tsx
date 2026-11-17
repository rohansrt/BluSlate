import Link from "next/link";
import { site } from "@/lib/site";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {site.name}. Part of the{" "}
          <a href={site.ecosystem.url} className="font-medium text-foreground hover:underline">
            {site.ecosystem.name}
          </a>{" "}
          ecosystem.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground hover:underline">
              {l.label}
            </Link>
          ))}
          <a href={`mailto:${site.contactEmail}`} className="hover:text-foreground hover:underline">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
