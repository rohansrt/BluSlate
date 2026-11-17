import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MODEL_CATALOG, MODELS } from "@bluslate/ai";
import { AdminShell } from "@/components/admin/admin-shell";
import { AddModelForm } from "@/components/admin/add-model-form";
import { requireAdmin } from "@/lib/admin";
import { credentialPresent } from "@/lib/ai-models";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Add a model", robots: { index: false, follow: false } };

export default async function NewModelPage() {
  const admin = await requireAdmin();
  const [existing, defaults] = await Promise.all([
    prisma.aiModel.findMany({ select: { modelId: true } }),
    prisma.aiModelAssignment.findMany({ where: { scope: "default" }, select: { tier: true } }),
  ]);
  const added = new Set(existing.map((m) => m.modelId));
  const catalog = MODEL_CATALOG.map((c) => {
    const price = MODELS[c.modelId];
    return {
      modelId: c.modelId,
      displayName: c.displayName,
      suggestedTier: c.suggestedTier,
      summary: c.summary,
      input: price?.input ?? 0,
      output: price?.output ?? 0,
      cacheRead: price?.cacheRead ?? 0,
      added: added.has(c.modelId),
    };
  });

  return (
    <AdminShell
      active="/admin/models"
      adminEmail={admin.email}
      title="Add a model"
      description="Pick a model, point it at its API key, and choose where BluSlate uses it."
      actions={
        <Link
          href="/admin/models"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to models
        </Link>
      }
    >
      <AddModelForm
        catalog={catalog}
        keyStatus={{ ANTHROPIC_API_KEY: credentialPresent("ANTHROPIC_API_KEY") }}
        defaultTiersTaken={defaults.map((d) => d.tier)}
      />
    </AdminShell>
  );
}
