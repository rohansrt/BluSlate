import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

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

/** Walk the three-step Home onboarding as Riya, ending in her city. */
export async function onboardAsRiya(page: Page) {
  await page.goto("/");
  const card = page.getByTestId("onboarding-card");
  const title = page.getByTestId("onboarding-step-title");
  const next = card.getByRole("button", { name: "Continue" });

  // 1. Name
  await expect(title).toHaveText("What should we call you?");
  await expect(card.getByText("Step 1 of 3")).toBeVisible();
  await expect(next).toBeDisabled();
  await card.getByLabel("Your first name").fill("Riya");
  await next.click();

  // 2. Where are you starting?
  await expect(title).toHaveText("Where are you starting?");
  await card.getByText("I have a new idea").click();
  await next.click();

  // 3. The idea, city and country, then straight into the city: no sign-in.
  await expect(title).toHaveText("What's the idea?");
  await card.getByLabel("Your idea in one sentence").fill("Cheaper e-bike rentals for students");
  await expect(card.getByRole("button", { name: "Open my city" })).toBeDisabled();
  await card.getByLabel("City").fill("Pune");
  await card.getByLabel("Country").selectOption("IN");

  // The draft survives a reload before it is saved.
  await page.reload();
  await expect(page.getByTestId("onboarding-step-title")).toHaveText("What's the idea?");
  await expect(page.getByLabel("City")).toHaveValue("Pune");

  await page.getByRole("button", { name: "Open my city" }).click();
  // First visits compile on demand in dev, so allow time.
  await expect(page).toHaveURL(/\/startups\/[a-z0-9]+$/, { timeout: 20_000 });
}
