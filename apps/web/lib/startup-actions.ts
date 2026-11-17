"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { LIMITS } from "@/lib/onboarding";
import { renameStartupForOwner } from "@/lib/startups";

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
