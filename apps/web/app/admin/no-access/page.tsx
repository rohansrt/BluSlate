import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card } from "@bluslate/ui";

export const metadata: Metadata = {
  title: "No admin access",
  robots: { index: false, follow: false },
};

export default function NoAccessPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card className="p-6 sm:p-8" data-testid="no-admin-access">
        <h1 className="text-2xl font-bold tracking-tight">No admin access</h1>
        <p className="mt-2 text-muted-foreground">
          You&apos;re signed in, but this account isn&apos;t on the admin list. Ask an admin to add
          your email to <code>ADMIN_EMAILS</code>.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go home</Link>
        </Button>
      </Card>
    </div>
  );
}
