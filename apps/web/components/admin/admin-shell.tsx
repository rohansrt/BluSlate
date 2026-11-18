import Link from "next/link";
import {
  BarChart3,
  Bot,
  Handshake,
  LineChart,
  MessageSquareHeart,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@bluslate/ui";

const NAV = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
  { href: "/admin/consult", label: "Consult requests", icon: Handshake },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareHeart },
  { href: "/admin/models", label: "AI models", icon: Bot },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
] as const;

/** Layout for admin pages: a title bar, sub-navigation and the privacy reminder. */
export function AdminShell({
  active,
  adminEmail,
  title,
  description,
  actions,
  children,
}: {
  active: (typeof NAV)[number]["href"];
  adminEmail: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-primary" aria-hidden /> Admin · {adminEmail}
        </p>
        <p>Founders&apos; ideas and answers are never shown here.</p>
      </div>
      <nav aria-label="Admin" className="mt-4 flex gap-1 overflow-x-auto border-b border-border">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active === href ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold",
              active === href
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/** A single headline number with its label (a stat tile). */
export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
