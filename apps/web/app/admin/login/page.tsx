import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card } from "@bluslate/ui";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { currentAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

/** Admin sign-in with email and password (decision 0005). */
export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card className="p-6 sm:p-8">
        <ShieldCheck className="size-8 text-primary" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-muted-foreground">
          For the BluSlate team. Only admin accounts can sign in here.
        </p>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </Card>
    </div>
  );
}
