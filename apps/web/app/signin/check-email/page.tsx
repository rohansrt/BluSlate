import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { Card } from "@bluslate/ui";

export const metadata: Metadata = {
  title: "Check your email",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card className="p-6 sm:p-8" data-testid="check-email">
        <MailCheck className="size-8 text-primary" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-2 text-muted-foreground">
          We sent you a sign-in link. Open it on this device to continue. It works once and expires
          in 24 hours.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Can&apos;t find it? Check your spam folder, or go back and ask for a new link.
        </p>
        {isDev && (
          <p className="mt-6 rounded-lg bg-review-soft px-3 py-2 text-sm text-review">
            Running locally: no email is sent. The link is printed in the terminal running{" "}
            <code>pnpm dev</code> and saved in <code>.dev-mail/</code>.
          </p>
        )}
      </Card>
    </div>
  );
}
