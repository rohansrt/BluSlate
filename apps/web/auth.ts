import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
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
      return session;
    },
  },
  trustHost: true,
});
