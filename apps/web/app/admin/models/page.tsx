import type { Metadata } from "next";
import Link from "next/link";
import { Bot, CheckCircle2, CircleAlert, CircleDashed, Plus } from "lucide-react";
import { CORE_TASKS } from "@bluslate/ai";
import { Badge, Button, Card, Select } from "@bluslate/ui";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin";
import { deleteModel, retestModel, saveAssignments, setModelEnabled } from "@/lib/admin-actions";
import { SCOPES, TIERS, credentialPresent } from "@/lib/ai-models";
import { prisma } from "@/lib/db";
import { PILLAR_AI_TASKS } from "@/lib/pillar-modules";
import type { PillarId } from "@/lib/pillars";

export const metadata: Metadata = { title: "AI models", robots: { index: false, follow: false } };

const usd = (v: number) => (v === 0 ? "$0" : `$${v.toFixed(v < 1 ? 4 : 2)}`);

/** Where each live AI feature runs, so admins know which tier matters today. */
const LIVE_FEATURES = CORE_TASKS.map((t) => ({
  id: t.id,
  tier: t.tier,
  name: t.id === "core.explain" ? "Guide me" : t.id,
}));

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const [models, assignments, usage] = await Promise.all([
    prisma.aiModel.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.aiModelAssignment.findMany(),
    prisma.aiCall.groupBy({ by: ["model"], _count: { _all: true }, _sum: { costUsd: true } }),
  ]);
  const assigned = (scope: string, tier: string) =>
    assignments.find((a) => a.scope === scope && a.tier === tier)?.modelId ?? "";
  const usageFor = (modelId: string) => usage.find((u) => u.model === modelId);
  const enabled = models.filter((m) => m.enabled);

  return (
    <AdminShell
      active="/admin/models"
      adminEmail={admin.email}
      title="AI models"
      description="Add models once, then choose which one each pillar uses. API keys stay in the server's environment; they are never stored here."
      actions={
        <Button asChild>
          <Link href="/admin/models/new">
            <Plus aria-hidden /> Add a model
          </Link>
        </Button>
      }
    >
      {params.added && (
        <p role="status" className="mb-6 rounded-xl bg-actual-soft px-4 py-3 text-sm text-actual">
          Added {params.added}. Check where it&apos;s used below.
        </p>
      )}
      {params.saved && (
        <p role="status" className="mb-6 rounded-xl bg-actual-soft px-4 py-3 text-sm text-actual">
          Saved. Pillars now use the models shown below.
        </p>
      )}

      {models.length === 0 ? (
        <Card
          className="flex flex-col items-center px-6 py-14 text-center"
          data-testid="models-empty"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-founder-soft text-primary">
            <Bot className="size-7" aria-hidden />
          </span>
          <h2 className="mt-4 text-xl font-semibold">No AI models added yet</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Until you add one, AI features such as &ldquo;Guide me&rdquo; show a message and
            founders answer by hand. Adding a model takes a minute: pick it, check its key, and
            choose where it&apos;s used.
          </p>
          <Button asChild className="mt-6">
            <Link href="/admin/models/new">
              <Plus aria-hidden /> Add your first model
            </Link>
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" data-testid="models-list">
          {models.map((m) => {
            const keySet = credentialPresent(m.credentialEnv);
            const u = usageFor(m.modelId);
            const status = !keySet
              ? {
                  icon: CircleAlert,
                  text: `Key missing: add ${m.credentialEnv}`,
                  cls: "text-review",
                }
              : m.lastTestOk
                ? { icon: CheckCircle2, text: "Connected", cls: "text-actual" }
                : m.lastTestOk === false
                  ? {
                      icon: CircleAlert,
                      text: m.lastTestMessage ?? "Test failed",
                      cls: "text-danger",
                    }
                  : { icon: CircleDashed, text: "Not tested", cls: "text-muted-foreground" };
            const StatusIcon = status.icon;
            return (
              <li key={m.id}>
                <Card className="h-full p-5" data-testid={`model-${m.modelId}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{m.displayName}</h2>
                      <p className="font-mono text-xs text-muted-foreground">{m.modelId}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="neutral">Anthropic</Badge>
                      {!m.enabled && <Badge variant="review">Off</Badge>}
                    </div>
                  </div>
                  <p className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${status.cls}`}>
                    <StatusIcon className="size-4" aria-hidden /> {status.text}
                  </p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Input / 1M</dt>
                      <dd className="font-semibold tabular-nums">${m.inputPerMTok}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Output / 1M</dt>
                      <dd className="font-semibold tabular-nums">${m.outputPerMTok}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Used</dt>
                      <dd className="font-semibold tabular-nums">
                        {u ? `${u._count._all} calls · ${usd(u._sum.costUsd ?? 0)}` : "Not yet"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={retestModel}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Test connection
                      </Button>
                    </form>
                    <form action={setModelEnabled}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="enabled" value={m.enabled ? "false" : "true"} />
                      <Button type="submit" size="sm" variant="outline">
                        {m.enabled ? "Turn off" : "Turn on"}
                      </Button>
                    </form>
                    <form action={deleteModel}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <section aria-labelledby="where" className="mt-10">
        <h2 id="where" className="text-xl font-semibold">
          Where each model is used
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Each AI task runs at a tier: Fast, Standard or Top. Pick a model for each tier in the
          default row; override it for any pillar. Live today:{" "}
          {LIVE_FEATURES.map((f) => `${f.name} (${f.tier}, every pillar)`).join(", ")}.
        </p>
        {enabled.length === 0 ? (
          <Card className="mt-4 p-5 text-sm text-muted-foreground">
            Add and turn on a model to assign it to pillars.
          </Card>
        ) : (
          <form action={saveAssignments} className="mt-4">
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[44rem] text-sm" data-testid="assignments">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium">Pillar</th>
                    {TIERS.map((t) => (
                      <th key={t.id} className="px-4 py-3 font-medium">
                        {t.label}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {t.hint}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCOPES.map((scope) => (
                    <tr key={scope.id} className="border-b border-border last:border-0">
                      <th scope="row" className="px-4 py-3 text-left font-medium">
                        {scope.label}
                        {scope.id !== "default" && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {PILLAR_AI_TASKS[scope.id as PillarId].length} AI tasks planned
                          </span>
                        )}
                      </th>
                      {TIERS.map((t) => (
                        <td key={t.id} className="px-4 py-2">
                          <label className="sr-only" htmlFor={`assign:${scope.id}:${t.id}`}>
                            {scope.label}, {t.label} tier
                          </label>
                          <Select
                            id={`assign:${scope.id}:${t.id}`}
                            name={`assign:${scope.id}:${t.id}`}
                            defaultValue={assigned(scope.id, t.id)}
                            className="h-9 text-sm"
                          >
                            <option value="">
                              {scope.id === "default" ? "No model" : "Use default"}
                            </option>
                            {enabled.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.displayName}
                              </option>
                            ))}
                          </Select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Button type="submit" className="mt-4">
              Save where models are used
            </Button>
          </form>
        )}
      </section>
    </AdminShell>
  );
}
