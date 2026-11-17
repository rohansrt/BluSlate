"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, requireAdmin } from "@/lib/admin";
import { SCOPES, TIERS, isAllowedCredentialEnv, testModelConnection } from "@/lib/ai-models";
import { prisma } from "@/lib/db";

export interface ActionState {
  ok?: boolean;
  message?: string;
}

const price = z.coerce.number().min(0).max(1000);

const modelForm = z.object({
  provider: z.literal("anthropic"),
  modelId: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9][a-z0-9.-]{1,80}$/,
      "Model IDs use lowercase letters, numbers, dots and dashes.",
    ),
  displayName: z.string().trim().min(1).max(80),
  credentialEnv: z
    .string()
    .trim()
    .refine(
      isAllowedCredentialEnv,
      "The key name must end in _API_KEY, for example ANTHROPIC_API_KEY.",
    ),
  inputPerMTok: price,
  outputPerMTok: price,
  cacheReadPerMTok: price,
  assignTier: z.enum(["", "fast", "standard", "top"]).optional(),
  notes: z.string().trim().max(300).optional(),
});

function readModelForm(formData: FormData) {
  return modelForm.safeParse({
    provider: formData.get("provider"),
    modelId: formData.get("modelId"),
    displayName: formData.get("displayName"),
    credentialEnv: formData.get("credentialEnv"),
    inputPerMTok: formData.get("inputPerMTok"),
    outputPerMTok: formData.get("outputPerMTok"),
    cacheReadPerMTok: formData.get("cacheReadPerMTok"),
    assignTier: formData.get("assignTier") ?? "",
    notes: formData.get("notes") ?? undefined,
  });
}

/** Step 5 of "Add a model": check the key and model ID before saving (free; no tokens). */
export async function testDraftConnection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = readModelForm(formData);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const result = await testModelConnection(parsed.data);
  await audit(admin.email, "model.test", { modelId: parsed.data.modelId, ok: result.ok });
  return result;
}

export async function createModel(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = readModelForm(formData);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const d = parsed.data;
  const existing = await prisma.aiModel.findUnique({
    where: { provider_modelId: { provider: d.provider, modelId: d.modelId } },
  });
  if (existing) return { ok: false, message: `${d.modelId} has already been added.` };

  const test = await testModelConnection(d);
  const model = await prisma.aiModel.create({
    data: {
      displayName: d.displayName,
      provider: d.provider,
      modelId: d.modelId,
      credentialEnv: d.credentialEnv,
      inputPerMTok: d.inputPerMTok,
      outputPerMTok: d.outputPerMTok,
      cacheReadPerMTok: d.cacheReadPerMTok,
      notes: d.notes || null,
      lastTestedAt: new Date(),
      lastTestOk: test.ok,
      lastTestMessage: test.message,
      createdBy: admin.email,
    },
  });
  if (d.assignTier) {
    await prisma.aiModelAssignment.upsert({
      where: { scope_tier: { scope: "default", tier: d.assignTier } },
      create: { scope: "default", tier: d.assignTier, modelId: model.id, updatedBy: admin.email },
      update: { modelId: model.id, updatedBy: admin.email },
    });
  }
  await audit(admin.email, "model.create", {
    modelId: d.modelId,
    assignedDefaultTier: d.assignTier || null,
  });
  revalidatePath("/admin/models");
  redirect(`/admin/models?added=${encodeURIComponent(d.modelId)}`);
}

export async function retestModel(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const model = await prisma.aiModel.findUnique({ where: { id } });
  if (!model) return;
  const test = await testModelConnection(model);
  await prisma.aiModel.update({
    where: { id },
    data: { lastTestedAt: new Date(), lastTestOk: test.ok, lastTestMessage: test.message },
  });
  await audit(admin.email, "model.test", { modelId: model.modelId, ok: test.ok });
  revalidatePath("/admin/models");
}

export async function setModelEnabled(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const enabled = formData.get("enabled") === "true";
  const model = await prisma.aiModel.update({ where: { id }, data: { enabled } });
  await audit(admin.email, enabled ? "model.enable" : "model.disable", { modelId: model.modelId });
  revalidatePath("/admin/models");
}

export async function deleteModel(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const model = await prisma.aiModel.delete({ where: { id } });
  await audit(admin.email, "model.delete", { modelId: model.modelId });
  revalidatePath("/admin/models");
}

/** Save the pillar × tier table. An empty cell means "use the default" (or "none" for the default row). */
export async function saveAssignments(formData: FormData) {
  const admin = await requireAdmin();
  const models = new Set(
    (await prisma.aiModel.findMany({ select: { id: true } })).map((m) => m.id),
  );
  const changes: Record<string, string | null> = {};
  await prisma.$transaction(async (tx) => {
    for (const scope of SCOPES) {
      for (const tier of TIERS) {
        const value = String(formData.get(`assign:${scope.id}:${tier.id}`) ?? "");
        const key = { scope_tier: { scope: scope.id, tier: tier.id } };
        if (value && models.has(value)) {
          await tx.aiModelAssignment.upsert({
            where: key,
            create: { scope: scope.id, tier: tier.id, modelId: value, updatedBy: admin.email },
            update: { modelId: value, updatedBy: admin.email },
          });
          changes[`${scope.id}:${tier.id}`] = value;
        } else {
          await tx.aiModelAssignment.deleteMany({ where: { scope: scope.id, tier: tier.id } });
        }
      }
    }
  });
  await audit(admin.email, "assignments.save", changes);
  revalidatePath("/admin/models");
  redirect("/admin/models?saved=1");
}
