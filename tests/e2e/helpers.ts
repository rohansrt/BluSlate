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
export async function enterEmailCode(page: Page, email: string, submit = /Sign in|Start building/) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  // First visits compile on demand in dev, so allow time.
  await expect(page.getByLabel(/6.digit code/)).toBeVisible({ timeout: 20_000 });
  await page.getByLabel(/6.digit code/).fill(await codeFor(email));
  await page.getByRole("button", { name: submit }).click();
}

/** A startup's own pages start with /startups/<id>/<step>. */
export const STEP_URL =
  /\/startups\/(?!new\/?$)[a-z0-9]+\/(discover|customers|market|build|setup|gtm|run-grow|pack)$/;

/** The startup's base URL, /startups/<id>, from any of its pages. */
export function startupUrl(page: Page): string {
  const url = new URL(page.url());
  const [, , id] = url.pathname.split("/");
  return `${url.origin}/startups/${id}`;
}

export function startupIdOf(page: Page): string {
  return new URL(page.url()).pathname.split("/")[2]!;
}

/** Steps 1 to 3 of the Home onboarding (name, path, idea), up to "Save your startup". */
async function onboardToSave(page: Page, name: string, idea: string) {
  await page.goto("/");
  const card = page.getByTestId("onboarding-card");
  const title = page.getByTestId("onboarding-step-title");
  const next = card.getByRole("button", { name: "Continue" });

  // 1. Just the first name: no age (decision 0012).
  await expect(title).toHaveText("What should we call you?");
  await expect(card.getByText("Step 1 of 4")).toBeVisible();
  await expect(next).toBeDisabled();
  await expect(card.getByLabel("Your age")).toHaveCount(0);
  await card.getByLabel("Your first name").fill(name);
  await next.click();

  // 2. Where are you starting?
  await expect(title).toHaveText("Where are you starting?");
  await card.getByText("I have a new idea").click();
  await next.click();

  // 3. The idea only: the market is asked later, in Customer and Market (decision 0012).
  await expect(title).toHaveText("What's the idea?");
  await expect(card.getByLabel("Country")).toHaveCount(0);
  await expect(next).toBeDisabled();
  await card.getByLabel("Your idea in one sentence").fill(idea);

  // The draft survives a reload before it is saved.
  await page.reload();
  await expect(page.getByTestId("onboarding-step-title")).toHaveText("What's the idea?");
  await expect(page.getByLabel("Your idea in one sentence")).toHaveValue(idea);

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("onboarding-step-title")).toHaveText("Save your startup");
}

/**
 * Walk the four-step Home onboarding as Riya, signing up with a new email,
 * ending in the first step of her startup. Returns the email.
 */
export async function onboardAsRiya(page: Page, email = uniqueEmail("riya")): Promise<string> {
  await onboardToSave(page, "Riya", "Cheaper e-bike rentals for students");
  // 4. Save your startup: email, then the 6-digit code, then straight into a step.
  await enterEmailCode(page, email, /Start building/);
  // Via /startups/new, which saves the draft. No city page in between (decision 0012).
  await expect(page).toHaveURL(/\/startups\/[a-z0-9]+\/discover$/, { timeout: 30_000 });
  return email;
}

/** The same onboarding, saved as a guest from the last step (decision 0012). */
export async function onboardAsGuest(page: Page, email: string, name = "Asha") {
  await onboardToSave(page, name, "Tiffin delivery for hostels");
  const guest = page.getByTestId("guest-form");
  // The name was given in step 1, so only the email is asked.
  await expect(guest.getByLabel("Your first name")).toHaveCount(0);
  await guest.getByLabel("Your email").fill(email);
  await guest.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page).toHaveURL(/\/startups\/[a-z0-9]+\/discover$/, { timeout: 30_000 });
}

/** Fails if the page is wider than the screen (a sideways scroll on phones). */
export async function expectNoSidewaysScroll(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll, "page should not scroll sideways").toBeLessThanOrEqual(client);
}

/** A first sign-in asks for a first name on /welcome (docs/decisions/0011, 0012). */
export async function completeWelcome(page: Page, name = "Asha") {
  await expect(page).toHaveURL(/\/welcome/, { timeout: 20_000 });
  await expect(page.getByLabel("Your age")).toHaveCount(0);
  await page.getByLabel("Your first name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).not.toHaveURL(/\/welcome/, { timeout: 20_000 });
}

/** Sign in with an email code from the dev outbox, ending wherever sign-in redirects. */
export async function signInByEmail(page: Page, email: string, from = "/signin") {
  await page.goto(from);
  await enterEmailCode(page, email);
  await expect(page).not.toHaveURL(/\/signin/, { timeout: 20_000 });
}
