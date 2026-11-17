import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect } from "@playwright/test";

/** Where the dev mailer writes magic links (see apps/web/lib/mail.ts). */
const OUTBOX = path.resolve(import.meta.dirname, "../../.dev-mail");

export function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
}

/** Wait for the sign-in link the dev mailer saved for `email`, and return it. */
export async function magicLinkFor(email: string): Promise<string> {
  const file = path.join(OUTBOX, `${email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_")}.json`);
  let url = "";
  await expect
    .poll(
      async () => {
        try {
          url = (JSON.parse(await readFile(file, "utf8")) as { url: string }).url;
          return url;
        } catch {
          return "";
        }
      },
      { timeout: 15_000, message: `no magic link written for ${email}` },
    )
    .toContain("/api/auth/callback/resend");
  return url;
}
