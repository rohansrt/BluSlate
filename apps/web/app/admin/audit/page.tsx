import type { Metadata } from "next";
import { Card } from "@bluslate/ui";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Audit log", robots: { index: false, follow: false } };

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default async function AuditPage() {
  const admin = await requireAdmin();
  const rows = await prisma.adminAudit.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <AdminShell
      active="/admin/audit"
      adminEmail={admin.email}
      title="Audit log"
      description="Every admin action, newest first (last 200)."
    >
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5">{fmt.format(r.createdAt)}</td>
                <td className="px-4 py-2.5">{r.actorEmail}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.action}</td>
                <td className="max-w-md truncate px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  {r.detail ? JSON.stringify(r.detail) : ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nothing yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
