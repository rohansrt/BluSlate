"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LIMITS } from "@/lib/onboarding";
import { deleteStartupForOwner, renameStartupForOwner } from "@/lib/startups";

const renameSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(LIMITS.startupName),
});

export async function renameStartup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const parsed = renameSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return;
  await renameStartupForOwner(parsed.data.id, session.user.id, parsed.data.name);
  revalidatePath("/startups");
  revalidatePath(`/startups/${parsed.data.id}`);
}

/** Delete a startup and all its data. The owner confirms in the UI first. */
export async function deleteStartup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "yes") return;
  await deleteStartupForOwner(id, session.user.id);
  revalidatePath("/startups");
  revalidatePath("/");
  redirect("/startups?deleted=1");
}

const nameSchema = z.string().trim().min(1).max(LIMITS.firstName);

export async function updateName(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return;
  await prisma.user.update({ where: { id: session.user.id }, data: { name: parsed.data } });
  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}
