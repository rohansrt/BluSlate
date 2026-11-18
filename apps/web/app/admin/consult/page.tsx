import type { Metadata } from "next";
import { Button } from "@bluslate/ui";
import { AdminShell } from "@/components/admin/admin-shell";
import { audit, requireAdmin } from "@/lib/admin";
import { setConsultStatus } from "@/lib/account-actions";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Consult requests · Admin",
  robots: { index: false, follow: false },
};

const when = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});
const STATUSES = ["new", "contacted", "closed"] as const;

/** Consult requests founders sent from /consult (docs/decisions/0011). */
export default async function AdminConsultPage() {
  const admin = await requireAdmin();
  await audit(admin.email, "consult.view");
  const requests = await prisma.consultRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <AdminShell
      active="/admin/consult"
      adminEmail={admin.email}
      title="Consult requests"
      description="Founders who asked for real-world consulting. Each one is also emailed to the team."
    >
      {requests.length === 0 ? (
        <p className="text-muted-foreground">No requests yet.</p>
      ) : (
        <ul className="space-y-3" data-testid="consult-requests">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.name || "(no name)"}</p>
                  <p className="text-sm">
                    <a
                      href={`mailto:${r.email}`}
                      className="text-primary underline underline-offset-2"
                    >
                      {r.email}
                    </a>{" "}
                    ·{" "}
                    <a
                      href={`tel:${r.phone.replace(/[\s-]/g, "")}`}
                      className="underline underline-offset-2"
                    >
                      {r.phone}
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {when.format(r.createdAt)} · {r.userId ? "has an account" : "not signed in"} ·{" "}
                    {r.emailedAt ? "emailed to the team" : "not emailed"}
                  </p>
                </div>
                <form action={setConsultStatus} className="flex gap-1">
                  <input type="hidden" name="id" value={r.id} />
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      type="submit"
                      name="status"
                      value={s}
                      size="sm"
                      variant={r.status === s ? "default" : "outline"}
                      aria-pressed={r.status === s}
                    >
                      {s[0]!.toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                </form>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
