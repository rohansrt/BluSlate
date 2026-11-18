import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@bluslate/ui";
import { ProfileForm } from "@/components/auth/profile-form";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = { title: "Welcome", robots: { index: false, follow: false } };

function safeNext(value: string | string[] | undefined): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/signin/continue";
}

/** After a first sign-in: name and age, once (docs/decisions/0011). */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/welcome");
  const next = safeNext((await searchParams).next);
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, age: true },
  });
  if (profile?.name && profile.age != null) redirect(next);

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to BluSlate</h1>
        <p className="mt-2 text-muted-foreground">
          Tell us your name and age. Founders of every age are welcome.
        </p>
        <div className="mt-6">
          <ProfileForm
            name={profile?.name ?? ""}
            age={profile?.age ?? null}
            next={next}
            submitLabel="Continue"
          />
        </div>
      </Card>
    </div>
  );
}
