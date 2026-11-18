"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { firstNameSchema } from "@/lib/onboarding";
import { landingPathFor } from "@/lib/landing";

export interface ProfileFormState {
  error?: string;
}

/** Only allow redirects back into BluSlate itself. */
function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

function readProfile(formData: FormData) {
  const name = firstNameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!name.success) return { error: "Enter your first name." } as const;
  return { name: name.data } as const;
}

/**
 * The first name, asked once after a first sign-in (docs/decisions/0011) and
 * editable on Profile. Age isn't asked any more (decision 0012).
 */
export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const profile = readProfile(formData);
  if ("error" in profile) return { error: profile.error };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: profile.name },
  });
  revalidatePath("/", "layout");
  const next = safeNext(formData.get("next"), "/profile?saved=1");
  // A server action can't follow the /signin/continue route's own redirect, so resolve it here.
  redirect(next === "/signin/continue" ? await landingPathFor(session.user.id) : next);
}
