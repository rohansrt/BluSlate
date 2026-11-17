import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@bluslate/ui";
import { AdminShell, StatTile } from "@/components/admin/admin-shell";
import { audit, requireAdmin } from "@/lib/admin";
import { adminStats } from "@/lib/admin-stats";
import { PILLARS } from "@/lib/pillars";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const num = new Intl.NumberFormat("en-IN");
const usd = (v: number) => (v === 0 ? "$0" : `$${v.toFixed(v < 1 ? 4 : 2)}`);

const PATH_LABEL: Record<string, string> = {
  NEW_IDEA: "New idea",
  EXISTING: "Existing business",
  ONE_TOOL: "One tool",
};

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  await audit(admin.email, "dashboard.view");
  const s = await adminStats();
  const maxAdoption = Math.max(1, ...Object.values(s.adoption));

  return (
    <AdminShell
      active="/admin"
      adminEmail={admin.email}
      title="Overview"
      description="How BluSlate is being used."
    >
      <section aria-labelledby="people">
        <h2 id="people" className="sr-only">
          People and startups
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-stats">
          <StatTile
            label="People"
            value={num.format(s.users.total)}
            hint={`${num.format(s.users.withEmail)} with email · ${num.format(s.users.guests)} guests`}
          />
          <StatTile label="New people this week" value={num.format(s.users.newThisWeek)} />
          <StatTile
            label="Startups"
            value={num.format(s.startups.total)}
            hint={`${num.format(s.startups.newThisWeek)} new this week`}
          />
          <StatTile
            label="Published decisions"
            value={num.format(s.twin.versions)}
            hint={`${num.format(s.twin.drafts)} drafts waiting`}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Pillar use</h2>
          <p className="text-sm text-muted-foreground">
            Startups with at least one published answer in each pillar.
          </p>
          <table className="mt-4 w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th>Pillar</th>
                <th>Startups</th>
              </tr>
            </thead>
            <tbody>
              {PILLARS.map((p) => {
                const n = s.adoption[p.id];
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3">
                      {p.number} · {p.name}
                    </td>
                    <td className="w-1/2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted" aria-hidden>
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${(n / maxAdoption) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right tabular-nums">{num.format(n)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Startups by starting point</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {Object.entries(PATH_LABEL).map(([k, label]) => (
                <tr key={k} className="border-b border-border last:border-0">
                  <td className="py-2">{label}</td>
                  <td className="py-2 text-right tabular-nums">
                    {num.format(s.startups.byPath[k] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 className="mt-6 font-semibold">Business Twin</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {[
                ["Decision events", s.twin.decisions],
                ["Open drafts", s.twin.drafts],
                ["Pending proposals", s.twin.proposals],
                ["“May be outdated” marks", s.twin.stale],
                ["Assumptions registered", s.twin.assumptions],
              ].map(([label, v]) => (
                <tr key={label as string} className="border-b border-border last:border-0">
                  <td className="py-2">{label}</td>
                  <td className="py-2 text-right tabular-nums">{num.format(v as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <section aria-labelledby="ai" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="ai" className="text-xl font-semibold">
            AI usage
          </h2>
          <Link
            href="/admin/models"
            className="text-sm font-medium text-primary underline underline-offset-4"
          >
            {s.models.added === 0
              ? "No models added yet: add one"
              : `${s.models.connected} of ${s.models.added} models connected`}
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="AI calls"
            value={num.format(s.ai.calls)}
            hint={`${num.format(s.ai.callsThisWeek)} this week`}
          />
          <StatTile
            label="AI cost"
            value={usd(s.ai.costUsd)}
            hint={`${usd(s.ai.costThisWeek)} this week`}
          />
          <StatTile
            label="Average response time"
            value={s.ai.calls ? `${(s.ai.avgLatencyMs / 1000).toFixed(1)} s` : "–"}
          />
          <StatTile
            label="Calls that failed checks"
            value={num.format(
              (s.ai.byOutcome.invalid ?? 0) +
                (s.ai.byOutcome.refusal ?? 0) +
                (s.ai.byOutcome.error ?? 0),
            )}
            hint={`${num.format(s.ai.byOutcome.refusal ?? 0)} refusals · ${num.format(s.ai.byOutcome.invalid ?? 0)} invalid · ${num.format(s.ai.byOutcome.error ?? 0)} errors`}
          />
        </div>
        {s.ai.calls > 0 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {[
              {
                title: "By model",
                rows: s.ai.byModel.map((r) => ({ name: r.model, calls: r.calls, cost: r.costUsd })),
              },
              {
                title: "By task",
                rows: s.ai.byTask.map((r) => ({ name: r.task, calls: r.calls, cost: r.costUsd })),
              },
            ].map((t) => (
              <Card key={t.title} className="p-5">
                <h3 className="font-semibold">{t.title}</h3>
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 font-medium">Name</th>
                      <th className="py-1 text-right font-medium">Calls</th>
                      <th className="py-1 text-right font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r) => (
                      <tr key={r.name} className="border-t border-border">
                        <td className="py-2 font-mono text-xs">{r.name}</td>
                        <td className="py-2 text-right tabular-nums">{num.format(r.calls)}</td>
                        <td className="py-2 text-right tabular-nums">{usd(r.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
