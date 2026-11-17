import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { MERGE_COOKIE, mergeGuestInto, readMergeToken } from "@/lib/guest-merge";
import { sendMagicLink } from "@/lib/mail";

/**
 * Auth.js with email magic links (spec §6.0). Sessions are stored in Postgres.
 * Google sign-in can be added later as a second provider.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Resend({
      // Development falls back to the local outbox in lib/mail.ts.
      apiKey: process.env.AUTH_RESEND_KEY ?? "dev-outbox",
      from: process.env.EMAIL_FROM ?? "BluSlate",
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLink({ to: identifier, url });
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.isGuest = Boolean((user as { isGuest?: boolean }).isGuest);
      return session;
    },
  },
  events: {
    /** A guest who signed up in this browser keeps their startups. */
    async signIn({ user }) {
      if (!user.id) return;
      const jar = await cookies();
      const guestId = readMergeToken(jar.get(MERGE_COOKIE)?.value);
      if (!guestId) return;
      jar.delete(MERGE_COOKIE);
      await mergeGuestInto(guestId, user.id);
    },
  },
  trustHost: true,
});
