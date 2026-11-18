import type { LucideIcon } from "lucide-react";

/** Heading for the account pages (Idea Book, Collaborate, Consult, Feedback). */
export function AccountPageHeader({
  icon: Icon,
  title,
  lead,
}: {
  icon: LucideIcon;
  title: string;
  lead: string;
}) {
  return (
    <div>
      <h1 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight">
        <Icon className="size-7 text-primary" aria-hidden /> {title}
      </h1>
      <p className="mt-2 text-muted-foreground">{lead}</p>
    </div>
  );
}
