import Link from "next/link";
import { ArrowRight, FolderOpen, Plus } from "lucide-react";
import { Button, Card } from "@bluslate/ui";
import { StartupCard, type StartupSummary } from "@/components/startup-card";

/** Home for people with startups: pick up where you left off. */
export function ContinueCard({
  name,
  startups,
}: {
  name: string | null;
  startups: StartupSummary[];
}) {
  const [latest] = startups;
  return (
    <Card className="p-6 sm:p-8 lg:self-center" data-testid="continue-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your work</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">
        Welcome back{name ? `, ${name}` : ""}
      </h2>
      {latest && (
        <div className="mt-5">
          <StartupCard startup={latest} />
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {latest && (
          <Button asChild>
            <Link href={`/startups/${latest.id}`}>
              Continue <ArrowRight aria-hidden />
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/startups/new">
            <Plus aria-hidden /> Start another
          </Link>
        </Button>
        {startups.length > 1 && (
          <Button asChild variant="ghost">
            <Link href="/startups">
              <FolderOpen aria-hidden /> All {startups.length}
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
