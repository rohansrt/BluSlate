import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, Users, X } from "lucide-react";
import { Button, Card } from "@bluslate/ui";
import { AccountPageHeader } from "@/components/account/page-header";
import { FriendRequestForm } from "@/components/account/forms";
import { answerFriendRequest } from "@/lib/account-actions";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = { title: "Collaborate", robots: { index: false, follow: false } };

/**
 * Collaborate (docs/decisions/0011): friend requests by email. Working on the
 * same startup together comes later. Only accounts with a verified email
 * (signed in by code) can send or receive requests.
 */
export default async function CollaboratePage() {
  const user = await requireUser("/collaborate");
  const header = (
    <AccountPageHeader
      icon={Users}
      title="Collaborate"
      lead="Add friends on BluSlate. Soon you'll be able to work on the same startup together."
    />
  );

  if (user.isGuest || !user.email) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {header}
        <Card className="mt-8 p-6">
          <p>
            To add friends, sign in with a code first, so your friends know it&apos;s really you.
            Your guest startups come with you.
          </p>
          <Button asChild className="mt-4">
            <Link href="/signin?callbackUrl=%2Fcollaborate">Sign in with a code</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const email = user.email.toLowerCase();
  const [incoming, outgoing, acceptedToMe] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { toEmail: email, status: "pending" },
      include: { from: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendRequest.findMany({
      where: { fromUserId: user.id },
      include: { to: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendRequest.findMany({
      where: { toEmail: email, status: "accepted" },
      include: { from: { select: { name: true, email: true } } },
    }),
  ]);
  const friends = [
    ...acceptedToMe.map((r) => ({ id: r.id, name: r.from.name, email: r.from.email ?? "" })),
    ...outgoing
      .filter((r) => r.status === "accepted")
      .map((r) => ({ id: r.id, name: r.to?.name ?? null, email: r.toEmail })),
  ];
  const pendingSent = outgoing.filter((r) => r.status === "pending");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {header}

      <Card className="mt-8 p-6">
        <FriendRequestForm />
      </Card>

      <section aria-labelledby="requests" className="mt-10">
        <h2 id="requests" className="text-xl font-semibold">
          Requests for you
        </h2>
        {incoming.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No requests right now.</p>
        ) : (
          <ul className="mt-4 space-y-3" data-testid="incoming-requests">
            {incoming.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <p>
                    <span className="font-semibold">{r.from.name ?? "Someone"}</span>{" "}
                    <span className="text-muted-foreground">({r.from.email})</span> wants to be
                    friends
                  </p>
                  <form action={answerFriendRequest} className="flex gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" name="answer" value="accept" size="sm">
                      <Check aria-hidden /> Accept
                    </Button>
                    <Button type="submit" name="answer" value="decline" size="sm" variant="outline">
                      <X aria-hidden /> Decline
                    </Button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="friends" className="mt-10">
        <h2 id="friends" className="text-xl font-semibold">
          Friends{" "}
          {friends.length > 0 && <span className="text-muted-foreground">({friends.length})</span>}
        </h2>
        {friends.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No friends yet. Send a request above.</p>
        ) : (
          <ul
            className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card"
            data-testid="friends"
          >
            {friends.map((f) => (
              <li key={f.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                <span className="font-medium">{f.name ?? f.email}</span>
                <span className="text-sm text-muted-foreground">{f.email}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingSent.length > 0 && (
        <section aria-labelledby="sent" className="mt-10">
          <h2 id="sent" className="text-xl font-semibold">
            Sent, waiting for an answer
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {pendingSent.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" aria-hidden /> {r.toEmail}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
