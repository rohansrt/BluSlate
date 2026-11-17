import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@bluslate/ui";
import { ENTRY_PATH_LABEL } from "@/lib/startups";

export interface StartupSummary {
  id: string;
  name: string;
  geography: string;
  entryPath: keyof typeof ENTRY_PATH_LABEL;
  createdAt: Date;
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function StartupCard({ startup }: { startup: StartupSummary }) {
  return (
    <Link
      href={`/startups/${startup.id}`}
      className="flex h-full min-h-36 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/60"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{startup.name}</h3>
        <Badge variant="neutral">{ENTRY_PATH_LABEL[startup.entryPath]}</Badge>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4" aria-hidden /> {startup.geography}
      </p>
      <p className="mt-auto pt-4 text-xs text-muted-foreground">
        Started {dateFormat.format(startup.createdAt)}
      </p>
    </Link>
  );
}
