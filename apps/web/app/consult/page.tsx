import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { Card } from "@bluslate/ui";
import { auth } from "@/auth";
import { AccountPageHeader } from "@/components/account/page-header";
import { ConsultForm } from "@/components/account/forms";
import { WhatsAppIcon } from "@/components/account/whatsapp-icon";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Consult",
  description: "Ask the BluSlate team for real-world consulting on your startup.",
  alternates: { canonical: "/consult" },
};

/** Consult (docs/decisions/0011): a request form, emailed to the team and listed in admin. */
export default async function ConsultPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, guestEmail: true },
      })
    : null;
  const whatsappText = encodeURIComponent("Hi BluSlate, I'd like help with my startup.");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <AccountPageHeader
        icon={Handshake}
        title="Consult"
        lead="We'd love to consult you. BluSlate's team offers real-world consulting to startup founders."
      />

      <Card className="mt-8 p-6">
        <p className="mb-5">
          Drop your email, contact number and your request, and we&apos;ll reach out.
        </p>
        <ConsultForm name={user?.name ?? null} email={user?.email ?? user?.guestEmail ?? null} />
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5">
        <p className="text-muted-foreground">Meanwhile, you can message us:</p>
        <a
          href={`https://wa.me/${site.whatsapp.number}?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 font-semibold text-[#06281a] shadow-sm hover:bg-[#1fbe5b]"
          data-testid="whatsapp-link"
        >
          <WhatsAppIcon className="size-5" /> Reach out on WhatsApp
        </a>
        <span className="text-sm text-muted-foreground">{site.whatsapp.display}</span>
      </div>
    </div>
  );
}
