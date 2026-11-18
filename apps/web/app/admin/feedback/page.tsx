import type { Metadata } from "next";
import { Card } from "@bluslate/ui";
import { AdminShell, StatTile } from "@/components/admin/admin-shell";
import { BarList } from "@/components/admin/charts";
import { audit, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { NEEDS_WORK, USEFULNESS, WANT_NEXT, WORKS_WELL, labelFor, nps } from "@/lib/feedback";

export const metadata: Metadata = {
  title: "Feedback · Admin",
  robots: { index: false, follow: false },
};

const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

function tally(lists: string[][], options: readonly (readonly [string, string])[]) {
  const counts = new Map<string, number>(options.map(([id]) => [id, 0]));
  for (const list of lists) for (const id of list) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, value]) => ({ label: labelFor(options, id), value }))
    .sort((a, b) => b.value - a.value);
}

/** Feedback answers (docs/decisions/0011). */
export default async function AdminFeedbackPage() {
  const admin = await requireAdmin();
  await audit(admin.email, "feedback.view");
  const rows = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
  const scores = rows.flatMap((r) => (r.recommend == null ? [] : [r.recommend]));
  const score = nps(scores);
  const comments = rows.filter((r) => r.comment).slice(0, 50);

  return (
    <AdminShell
      active="/admin/feedback"
      adminEmail={admin.email}
      title="Feedback"
      description="What founders say works, what needs work, and what to build next."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Responses" value={String(rows.length)} />
        <StatTile
          label="Would recommend (NPS)"
          value={score == null ? "–" : String(score)}
          hint={`From ${scores.length} answers: % scoring 9–10 minus % scoring 0–6`}
        />
        <StatTile
          label="Find it very useful"
          value={
            rows.length
              ? `${Math.round((rows.filter((r) => r.usefulness === "very").length / rows.length) * 100)}%`
              : "–"
          }
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Works well</h3>
          <div className="mt-4">
            <BarList
              rows={tally(
                rows.map((r) => r.worksWell),
                WORKS_WELL,
              )}
              unit="answers"
            />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Needs the most work</h3>
          <div className="mt-4">
            <BarList
              rows={tally(
                rows.map((r) => r.needsWork),
                NEEDS_WORK,
              )}
              unit="answers"
            />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Wanted next</h3>
          <div className="mt-4">
            <BarList
              rows={tally(
                rows.map((r) => r.wantNext),
                WANT_NEXT,
              )}
              unit="answers"
            />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">How useful</h3>
          <div className="mt-4">
            <BarList
              rows={tally(
                rows.map((r) => (r.usefulness ? [r.usefulness] : [])),
                USEFULNESS,
              )}
              unit="answers"
            />
          </div>
        </Card>
      </div>
      <section aria-labelledby="comments" className="mt-8">
        <h2 id="comments" className="text-xl font-semibold">
          Latest comments
        </h2>
        {comments.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="whitespace-pre-wrap text-sm">{c.comment}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {when.format(c.createdAt)}
                  {c.recommend != null && ` · would recommend: ${c.recommend}/10`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
