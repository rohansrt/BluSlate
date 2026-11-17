import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  AiPlaceholder,
  EvidenceBadge,
  FounderPackIcon,
  PillarIcon,
  ReportBody,
} from "@bluslate/ui";
import { PrintButton } from "@/components/print-button";
import { PILLAR_WORKSPACES } from "@/lib/pillar-workspaces";
import { PILLARS } from "@/lib/pillars";
import { PILLAR_STATUS_INFO } from "@/lib/pillar-status";
import { requireUser } from "@/lib/require-user";
import { getStartupForUser } from "@/lib/startups";
import { twin } from "@/lib/twin";
import { loadWorkspace } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Founder Pack",
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * /startups/[id]/pack: the Founder Pack report (decision 0006, v1). One block
 * per pillar: its status, its report-out and its goals, with every value
 * labelled. Drafts are marked so they're never mistaken for approved work.
 */
export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/startups/${id}/pack`);
  const startup = await getStartupForUser(id, user.id);
  if (!startup) notFound();
  const statuses = await twin.statuses(startup.id);
  const blocks = await Promise.all(
    PILLARS.map(async (p) => {
      const ws = await loadWorkspace(startup, p.id);
      const def = PILLAR_WORKSPACES[p.id];
      return {
        pillar: p,
        status: statuses.pillars[p.id],
        started: ws.saved,
        published: Object.keys(ws.published).length > 0,
        report: def.report(ws.state, ws.ctx),
        goals: def.goals(ws.state, ws.ctx).filter((g) => g.value !== null),
      };
    }),
  );
  const started = blocks.filter((b) => b.started).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/startups/${startup.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> {startup.name}
        </Link>
        <PrintButton />
      </div>

      <header className="mt-4 border-b border-border pb-5">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <FounderPackIcon className="size-4" aria-hidden /> Founder Pack · report
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{startup.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {startup.geography} · {started} of 7 steps started · as of {dateFmt.format(new Date())}
        </p>
        <p className="mt-3 text-sm">
          Every value carries its label: <EvidenceBadge label="ASSUMED" /> your guess,{" "}
          <EvidenceBadge label="ESTIMATE" /> worked out from inputs, <EvidenceBadge label="FIELD" />{" "}
          real research, <EvidenceBadge label="SYNTHETIC" /> simulated. Nothing here is a
          prediction.
        </p>
      </header>

      <div className="mt-6 space-y-6">
        {blocks.map((b) => {
          const st = PILLAR_STATUS_INFO[b.status.status];
          return (
            <section
              key={b.pillar.id}
              className="break-inside-avoid rounded-xl border border-border bg-card p-5"
              data-testid={`pack-${b.pillar.id}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <PillarIcon id={b.pillar.id} className="size-5 text-primary" />
                  {b.pillar.number} · {b.pillar.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`size-2 rounded-full ${st.dot}`} />{" "}
                  {b.published ? st.label : b.started ? "Draft, not published" : "Not started"}
                </span>
              </div>
              {b.started ? (
                <>
                  <ReportBody block={b.report} />
                  {b.goals.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                      {b.goals.map((g) => (
                        <li key={g.id} className="rounded-lg bg-muted/60 px-3 py-1.5 text-xs">
                          <span className="text-muted-foreground">{g.title}:</span>{" "}
                          <span className="font-semibold">{g.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not started yet. This gap will show in the pack until it&apos;s filled.{" "}
                  <Link
                    href={`/startups/${startup.id}/${b.pillar.id}`}
                    className="text-primary underline-offset-4 hover:underline print:hidden"
                  >
                    Open {b.pillar.name}
                  </Link>
                </p>
              )}
            </section>
          );
        })}
      </div>

      <section className="mt-8 space-y-2 print:hidden" aria-label="Exports">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          More exports
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <AiPlaceholder
            title="Pitch narrative (PDF + outline)"
            detail="One section per slide, built from a frozen snapshot."
          />
          <AiPlaceholder
            title="Financial workbook (XLSX)"
            detail="P&L, cash flow and unit economics, formula-linked."
          />
          <AiPlaceholder
            title="Business Model Canvas"
            detail="Validated items styled apart from assumptions."
          />
          <AiPlaceholder
            title="Funding shortlist"
            detail="Verifiable funds and grants, each with a last-checked date."
          />
        </div>
      </section>
    </div>
  );
}
