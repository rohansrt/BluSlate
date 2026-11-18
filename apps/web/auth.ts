import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { MERGE_COOKIE, mergeGuestInto, readMergeToken } from "@/lib/guest-merge";
import { sendSignInCode } from "@/lib/mail";
import { CODE_MINUTES, generateCode } from "@/lib/sign-in-code";
import { resetWrongCodes } from "@/lib/sign-in-code-check";

/**
 * Auth.js with 6-digit email codes (spec §6.0, docs/decisions/0009). The email
 * provider's token is the code; the founder types it, and the code form sends
 * it through Auth.js's normal email callback. Sessions are stored in Postgres
 * and last 30 days from the last visit, so people stay signed in.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Stay signed in for 30 days after the last visit (Auth.js refreshes it daily).
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  providers: [
    Resend({
      // Development falls back to the local outbox in lib/mail.ts.
      apiKey: process.env.AUTH_RESEND_KEY ?? "dev-outbox",
      from: process.env.EMAIL_FROM ?? "BluSlate",
      maxAge: CODE_MINUTES * 60,
      // Pinned so lib/sign-in-code-check.ts hashes codes the same way.
      secret: process.env.AUTH_SECRET,
      generateVerificationToken: generateCode,
      async sendVerificationRequest({ identifier, token }) {
        await sendSignInCode({ to: identifier, code: token });
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin",
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
    /** A legacy guest who adds an email in this browser keeps their startups. */
    async signIn({ user }) {
      if (!user.id) return;
      if (user.email) await resetWrongCodes(user.email);
      const jar = await cookies();
      const guestId = readMergeToken(jar.get(MERGE_COOKIE)?.value);
      if (!guestId) return;
      jar.delete(MERGE_COOKIE);
      await mergeGuestInto(guestId, user.id);
    },
  },
  trustHost: true,
});
