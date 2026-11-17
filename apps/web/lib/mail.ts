import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Sends the sign-in magic link.
 *
 * - With AUTH_RESEND_KEY and EMAIL_FROM set, the email goes out through Resend.
 * - Without them, outside production, the link is printed in the terminal and
 *   written to `.dev-mail/<email>.json` at the repo root, so you (and the
 *   Playwright tests) can sign in locally without sending real email.
 * - In production without a key, sign-in fails loudly rather than silently.
 */

export interface MagicLinkMessage {
  to: string;
  url: string;
}

// Development only; excluded from Next's output file tracing.
export const DEV_OUTBOX_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.cwd(),
  process.env.DEV_MAIL_DIR ?? "../../.dev-mail",
);

export function outboxFileFor(email: string): string {
  return path.join(DEV_OUTBOX_DIR, `${email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_")}.json`);
}

export async function sendMagicLink({ to, url }: MagicLinkMessage): Promise<void> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.EMAIL_FROM;

  if (apiKey && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: "Your BluSlate sign-in link",
        html: emailHtml(url),
        text: emailText(url),
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend rejected the sign-in email (HTTP ${res.status}).`);
    }
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Sign-in email is not configured: set AUTH_RESEND_KEY and EMAIL_FROM.");
  }

  await mkdir(DEV_OUTBOX_DIR, { recursive: true });
  await writeFile(
    outboxFileFor(to),
    JSON.stringify({ to, url, sentAt: new Date().toISOString() }, null, 2),
  );
  console.info(`\n[dev mail] Sign-in link for ${to}:\n${url}\n`);
}

function emailText(url: string): string {
  return [
    "Sign in to BluSlate",
    "",
    "Use this link to sign in. It works once and expires in 24 hours:",
    url,
    "",
    "If you didn't ask for this, you can ignore this email.",
  ].join("\n");
}

function emailHtml(url: string): string {
  const safeUrl = url.replace(/"/g, "&quot;");
  return `<!doctype html>
<html><body style="margin:0;background:#f6f8fe;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0b1530">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #dfe5f2;border-radius:16px;padding:32px">
        <tr><td style="font-size:20px;font-weight:700;padding-bottom:4px"><span style="color:#004bfc">Blu</span>Slate</td></tr>
        <tr><td style="font-size:16px;line-height:24px;padding:16px 0">Use the button below to sign in. The link works once and expires in 24 hours.</td></tr>
        <tr><td style="padding:8px 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#004bfc;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">Sign in to BluSlate</a></td></tr>
        <tr><td style="font-size:13px;line-height:20px;color:#55617a">If you didn't ask for this, you can ignore this email. Nobody can sign in without the link.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
