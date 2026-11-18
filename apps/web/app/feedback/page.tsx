import type { Metadata } from "next";
import { MessageSquareHeart } from "lucide-react";
import { Card } from "@bluslate/ui";
import { AccountPageHeader } from "@/components/account/page-header";
import { FeedbackForm } from "@/components/account/forms";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Tell the BluSlate team what works and what to build next.",
  alternates: { canonical: "/feedback" },
};

/** Feedback (docs/decisions/0011): five quick questions and an optional note. */
export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <AccountPageHeader
        icon={MessageSquareHeart}
        title="Feedback"
        lead="Five quick questions. Every answer helps us decide what to build next."
      />
      <Card className="mt-8 p-6">
        <FeedbackForm />
      </Card>
    </div>
  );
}
