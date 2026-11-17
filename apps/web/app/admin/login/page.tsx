import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card } from "@bluslate/ui";
import { SignInForm } from "@/components/auth/sign-in-form";
import { currentAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card className="p-6 sm:p-8">
        <ShieldCheck className="size-8 text-primary" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-muted-foreground">
          We&apos;ll email you a sign-in link. Only addresses on the admin list can open the
          dashboard.
        </p>
        <div className="mt-6">
          <SignInForm redirectTo="/admin" />
        </div>
      </Card>
    </div>
  );
}
