"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { audit, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { feedbackSchema } from "@/lib/feedback";
import { sendTeamEmail } from "@/lib/mail";
import { hit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/sign-in-code";

/**
 * The account pages in the profile menu (docs/decisions/0011): Idea Book,
 * Collaborate (friend requests), Consult and Feedback.
 */

const DAY = 24 * 60 * 60 * 1000;
const emailSchema = z.email().max(254);

export interface FormState {
  ok?: string;
  error?: string;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Signed-in people and guests. */
async function currentUser() {
  const session = await auth();
  return session?.user?.id ? session.user : null;
}

// ─── Idea Book ──────────────────────────────────────────────────────────────

const ideaSchema = z.string().trim().min(3).max(500);

export async function saveIdea(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=%2Fideas");
  const text = ideaSchema.safeParse(String(formData.get("text") ?? ""));
  if (!text.success) return { error: "Write the idea in a few words (up to 500 characters)." };
  const source = formData.get("source") === "suggested" ? "suggested" : "own";
  const count = await prisma.ideaNote.count({ where: { userId: user.id } });
  if (count >= 500) return { error: "Your Idea Book is full. Delete a few ideas first." };
  await prisma.ideaNote.create({ data: { userId: user.id, text: text.data, source } });
  revalidatePath("/ideas");
  return { ok: "Saved to your Idea Book." };
}

export async function deleteIdea(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=%2Fideas");
  await prisma.ideaNote.deleteMany({
    where: { id: String(formData.get("id") ?? ""), userId: user.id },
  });
  revalidatePath("/ideas");
}

// ─── Collaborate ────────────────────────────────────────────────────────────

/**
 * Send a friend request to an email. The reply is the same whether or not
 * that email has an account, so nobody can use this to find out who uses
 * BluSlate. Only people with a verified email (signed in by code) can send
 * or receive requests; a guest's typed email isn't proof of who they are.
 */
export async function sendFriendRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=%2Fcollaborate");
  if (user.isGuest || !user.email)
    return { error: "Sign in with a code first, so your friends know it's really you." };
  const parsed = emailSchema.safeParse(normalizeEmail(formData.get("email")));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const toEmail = parsed.data;
  if (toEmail === user.email.toLowerCase()) return { error: "That's your own email." };
  if ((await hit(`friend:${user.id}`, DAY)) > 20)
    return { error: "You've sent a lot of requests today. Try again tomorrow." };

  const recipient = await prisma.user.findUnique({
    where: { email: toEmail },
    select: { id: true },
  });

  // They already asked us: accept theirs instead of sending a second request.
  if (recipient) {
    const theirs = await prisma.friendRequest.findUnique({
      where: {
        fromUserId_toEmail: { fromUserId: recipient.id, toEmail: user.email.toLowerCase() },
      },
    });
    if (theirs && theirs.status === "pending") {
      await prisma.friendRequest.update({
        where: { id: theirs.id },
        data: { status: "accepted", toUserId: user.id, respondedAt: new Date() },
      });
      revalidatePath("/collaborate");
      return { ok: "They had already sent you a request, so you're now friends." };
    }
  }

  const existing = await prisma.friendRequest.findUnique({
    where: { fromUserId_toEmail: { fromUserId: user.id, toEmail } },
  });
  if (existing?.status === "accepted") return { ok: "You're already friends." };
  if (existing) {
    await prisma.friendRequest.update({
      where: { id: existing.id },
      data: { status: "pending", respondedAt: null, toUserId: recipient?.id ?? null },
    });
  } else {
    await prisma.friendRequest.create({
      data: { fromUserId: user.id, toEmail, toUserId: recipient?.id ?? null },
    });
  }
  revalidatePath("/collaborate");
  return {
    ok: `Request sent. If ${toEmail} uses BluSlate, they'll see it in Collaborate when they sign in.`,
  };
}

export async function answerFriendRequest(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=%2Fcollaborate");
  if (user.isGuest || !user.email) return;
  const accept = formData.get("answer") === "accept";
  await prisma.friendRequest.updateMany({
    where: {
      id: String(formData.get("id") ?? ""),
      toEmail: user.email.toLowerCase(),
      status: "pending",
    },
    data: {
      status: accept ? "accepted" : "declined",
      toUserId: user.id,
      respondedAt: new Date(),
    },
  });
  revalidatePath("/collaborate");
  revalidatePath("/", "layout");
}

// ─── Consult ────────────────────────────────────────────────────────────────

const consultSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[0-9][0-9\s-]{6,19}$/,
      "Enter a phone number with digits only (and +, spaces or -).",
    ),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(2000),
});

/** A request for real-world consulting: stored for the admin dashboard and emailed to the team. */
export async function requestConsult(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser();
  const parsed = consultSchema.safeParse({
    name: String(formData.get("name") ?? "") || undefined,
    email: normalizeEmail(formData.get("email")),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const key = user ? `consult:${user.id}` : `consult:ip:${await clientIp()}`;
  if ((await hit(key, DAY)) > 5)
    return { error: "We've got your requests. We'll reach out soon, or message us on WhatsApp." };

  const request = await prisma.consultRequest.create({
    data: { ...parsed.data, userId: user?.id ?? null },
  });

  const to = process.env.CONSULT_NOTIFY_EMAIL;
  if (to) {
    try {
      await sendTeamEmail({
        to,
        replyTo: parsed.data.email,
        subject: `BluSlate consult request from ${parsed.data.name || parsed.data.email}`,
        text: [
          "A founder asked for a consultation on BluSlate.",
          "",
          `Name: ${parsed.data.name || "(not given)"}`,
          `Email: ${parsed.data.email}`,
          `Phone: ${parsed.data.phone}`,
          `Account: ${user ? (user.isGuest ? "guest" : "signed in") : "not signed in"}`,
          "",
          "Request:",
          parsed.data.message,
          "",
          "All requests: https://bluslate.yoppi.in/admin/consult",
        ].join("\n"),
      });
      await prisma.consultRequest.update({
        where: { id: request.id },
        data: { emailedAt: new Date() },
      });
    } catch (err) {
      // The request is saved and visible in admin even if the email fails.
      console.error("Consult email failed", err);
    }
  }
  return { ok: "Thank you! We'll reach out soon." };
}

// ─── Feedback ───────────────────────────────────────────────────────────────

export async function sendFeedback(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await currentUser();
  const recommendRaw = String(formData.get("recommend") ?? "");
  const parsed = feedbackSchema.safeParse({
    worksWell: formData.getAll("worksWell").map(String),
    needsWork: formData.getAll("needsWork").map(String),
    usefulness: String(formData.get("usefulness") ?? "") || undefined,
    wantNext: formData.getAll("wantNext").map(String),
    recommend: recommendRaw === "" ? undefined : Number(recommendRaw),
    comment: String(formData.get("comment") ?? "") || undefined,
  });
  if (!parsed.success) return { error: "Something in the form isn't right. Please try again." };
  const d = parsed.data;
  if (
    !d.worksWell.length &&
    !d.needsWork.length &&
    !d.usefulness &&
    !d.wantNext.length &&
    d.recommend == null &&
    !d.comment
  )
    return { error: "Answer at least one question." };
  const key = user ? `feedback:${user.id}` : `feedback:ip:${await clientIp()}`;
  if ((await hit(key, DAY)) > 10) return { error: "Thanks, we've got plenty from you today!" };
  await prisma.feedback.create({ data: { ...d, userId: user?.id ?? null } });
  return { ok: "Thank you! Your feedback helps us decide what to build next." };
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function setConsultStatus(formData: FormData) {
  const admin = await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!["new", "contacted", "closed"].includes(status)) return;
  const id = String(formData.get("id") ?? "");
  await prisma.consultRequest.update({ where: { id }, data: { status } });
  await audit(admin.email, "consult.status", { id, status });
  revalidatePath("/admin/consult");
}
