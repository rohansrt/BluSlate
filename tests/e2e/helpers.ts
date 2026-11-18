import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

/** The seven pillar names, in order. */
export const PILLAR_NAMES = [
  "Problem Discovery",
  "Customer Discovery",
  "Market Research",
  "Product Design",
  "Operations Setup",
  "Go-to-Market Plan",
  "Launch & Growth",
];

/** Where the dev mailer writes sign-in codes (see apps/web/lib/mail.ts). */
const OUTBOX = path.resolve(import.meta.dirname, "../../.dev-mail");

export function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
}

/** Wait for a sign-in code the dev mailer saved for `email` (other than `not`), and return it. */
export async function codeFor(email: string, not?: string): Promise<string> {
  const file = path.join(OUTBOX, `${email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_")}.json`);
  let code = "";
  await expect
    .poll(
      async () => {
        try {
          code = (JSON.parse(await readFile(file, "utf8")) as { code?: string }).code ?? "";
          return code && code !== not ? code : "";
        } catch {
          return "";
        }
      },
      { timeout: 15_000, message: `no sign-in code written for ${email}` },
    )
    .toMatch(/^\d{6}$/);
  return code;
}

/** Ask for a code for `email` on the form that's open, then type it in. */
export async function enterEmailCode(page: Page, email: string, submit = /Sign in|Open my city/) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  // First visits compile on demand in dev, so allow time.
  await expect(page.getByLabel(/6.digit code/)).toBeVisible({ timeout: 20_000 });
  await page.getByLabel(/6.digit code/).fill(await codeFor(email));
  await page.getByRole("button", { name: submit }).click();
}

/**
 * Walk the four-step Home onboarding as Riya, signing up with a new email,
 * ending in her city. Returns the email.
 */
export async function onboardAsRiya(page: Page, email = uniqueEmail("riya")): Promise<string> {
  await page.goto("/");
  const card = page.getByTestId("onboarding-card");
  const title = page.getByTestId("onboarding-step-title");
  const next = card.getByRole("button", { name: "Continue" });

  // 1. Name and age
  await expect(title).toHaveText("What should we call you?");
  await expect(card.getByText("Step 1 of 4")).toBeVisible();
  await expect(next).toBeDisabled();
  await card.getByLabel("Your first name").fill("Riya");
  await expect(next).toBeDisabled();
  await card.getByLabel("Your age").fill("20");
  await next.click();

  // 2. Where are you starting?
  await expect(title).toHaveText("Where are you starting?");
  await card.getByText("I have a new idea").click();
  await next.click();

  // 3. The idea, city and country.
  await expect(title).toHaveText("What's the idea?");
  await card.getByLabel("Your idea in one sentence").fill("Cheaper e-bike rentals for students");
  await expect(next).toBeDisabled();
  await card.getByLabel("City").fill("Pune");
  await card.getByLabel("Country").selectOption("IN");

  // The draft survives a reload before it is saved.
  await page.reload();
  await expect(page.getByTestId("onboarding-step-title")).toHaveText("What's the idea?");
  await expect(page.getByLabel("City")).toHaveValue("Pune");

  await page.getByRole("button", { name: "Continue" }).click();

  // 4. Save your startup: email, then the 6-digit code, then into the city.
  await expect(page.getByTestId("onboarding-step-title")).toHaveText("Save your startup");
  await enterEmailCode(page, email, /Open my city/);
  // First visits compile on demand in dev, so allow time.
  // Via /startups/new, which saves the draft, to the city.
  await expect(page).toHaveURL(/\/startups\/(?!new$)[a-z0-9]+$/, { timeout: 30_000 });
  return email;
}

/** Fails if the page is wider than the screen (a sideways scroll on phones). */
export async function expectNoSidewaysScroll(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll, "page should not scroll sideways").toBeLessThanOrEqual(client);
}

/** A first sign-in asks for name and age on /welcome (docs/decisions/0011). */
export async function completeWelcome(page: Page, name = "Asha", age = "20") {
  await expect(page).toHaveURL(/\/welcome/, { timeout: 20_000 });
  await page.getByLabel("Your first name").fill(name);
  await page.getByLabel("Your age").fill(age);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).not.toHaveURL(/\/welcome/, { timeout: 20_000 });
}

/** Sign in with an email code from the dev outbox, ending wherever sign-in redirects. */
export async function signInByEmail(page: Page, email: string, from = "/signin") {
  await page.goto(from);
  await enterEmailCode(page, email);
  await expect(page).not.toHaveURL(/\/signin/, { timeout: 20_000 });
}
