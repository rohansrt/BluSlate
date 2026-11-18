import { expect, test } from "@playwright/test";
import {
  PILLAR_NAMES,
  codeFor,
  completeWelcome,
  enterEmailCode,
  expectNoSidewaysScroll,
  onboardAsRiya,
  uniqueEmail,
} from "./helpers";

test.describe("Home onboarding and sign-in with an email code (S1 exit gate)", () => {
  test("a new founder completes onboarding, signs up with a code and lands in an empty city", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Got a business idea?Will it work?",
    );
    // Signed out: one Sign in button at the top right (sign up is the same flow).
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign up" })).toHaveCount(0);

    await onboardAsRiya(page);
    await expect(page.getByTestId("city-title")).toHaveText("Riya's idea");
    await expect(page.getByText("Pune, India")).toBeVisible();
    await expect(page.getByText("Cheaper e-bike rentals for students")).toBeVisible();

    // An empty city: all seven hubs, none started, Discover suggested first.
    // getByRole skips the hidden layout (map on desktop, route list on mobile).
    const hubs = page.getByRole("list", { name: "City hubs" });
    await expect(hubs).toHaveCount(1);
    for (const name of PILLAR_NAMES) {
      await expect(hubs.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(hubs.getByText("Not started")).toHaveCount(6);
    await expect(hubs.getByText("Start here")).toHaveCount(1);
    await expectNoSidewaysScroll(page);

    // The logo goes to Home, which still opens with the hook, plus a "continue" card.
    await page.getByRole("link", { name: "BluSlate home" }).click();
    // Home may compile on first visit in dev.
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Will it work?");
    const cont = page.getByTestId("continue-card");
    await expect(cont.getByRole("heading", { name: "Welcome back, Riya" })).toBeVisible();
    await expect(cont.getByRole("link", { name: /Riya's idea/ })).toBeVisible();
    await expect(cont.getByRole("link", { name: "Start another" })).toBeVisible();
  });

  test("a returning founder on another device signs in and lands straight in their startup", async ({
    page,
    browser,
  }) => {
    const email = await onboardAsRiya(page);
    const cityUrl = page.url();

    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto("/signin");
    await enterEmailCode(otherPage, email);
    await expect(otherPage).toHaveURL(cityUrl, { timeout: 20_000 });
    await expect(otherPage.getByTestId("city-title")).toHaveText("Riya's idea");

    // The device remembers the email for next time.
    // Retried: a dev-server reload while compiling can close the menu mid-click.
    await expect(async () => {
      await otherPage.getByRole("button", { name: /Account menu for Riya/ }).click();
      await otherPage
        .getByRole("menu", { name: "Account" })
        .getByRole("menuitem", { name: "Log out" })
        .click({ timeout: 5_000 });
      await expect(
        otherPage.getByRole("banner").getByRole("link", { name: "Sign in" }),
      ).toBeVisible();
    }).toPass({ timeout: 45_000 });
    await otherPage.goto("/signin");
    await expect(otherPage.getByLabel("Email", { exact: true })).toHaveValue(email);
    await other.close();
  });

  test("a new person who signs in first gives name and age, then starts a 2-step onboarding", async ({
    page,
  }, testInfo) => {
    await page.goto("/signin");
    await enterEmailCode(page, uniqueEmail(`first-${testInfo.project.name}`));
    await expect(page.getByRole("heading", { name: "Welcome to BluSlate" })).toBeVisible({
      timeout: 20_000,
    });
    await completeWelcome(page, "Meera", "15");
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    const card = page.getByTestId("onboarding-card");
    await expect(page.getByTestId("onboarding-step-title")).toHaveText("Where are you starting?");
    await expect(card.getByText("Step 1 of 2")).toBeVisible();
    await expect(page.getByRole("button", { name: /Account menu for Meera/ })).toBeVisible();
  });

  test("a wrong code is refused, and the right one still works", async ({ page }, testInfo) => {
    const email = uniqueEmail(`wrong-${testInfo.project.name}`);
    await page.goto("/signin");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Email me a code" }).click();
    const code = await codeFor(email);
    const wrong = code === "000000" ? "111111" : "000000";
    await page.getByLabel(/6.digit code/).fill(wrong);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText("That code isn't right. Check the email and try again."),
    ).toBeVisible();
    await page.getByLabel(/6.digit code/).fill(code);
    await page.getByRole("button", { name: "Sign in" }).click();
    // A new account is asked for name and age first.
    await expect(page).toHaveURL(/\/welcome$/, { timeout: 20_000 });
    await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toHaveCount(0);
  });

  test("guessing codes against Auth.js directly is cut off after five tries", async ({
    page,
    request,
  }, testInfo) => {
    const email = uniqueEmail(`guess-${testInfo.project.name}`);
    await page.goto("/signin");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Email me a code" }).click();
    const code = await codeFor(email);
    const guess = (token: string) =>
      request.get(
        `/api/auth/callback/resend?${new URLSearchParams({ email, token, callbackUrl: "/" })}`,
        { maxRedirects: 0 },
      );
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 4; i++) {
      expect((await guess(wrong)).headers().location).toContain("error=Verification");
    }
    expect((await guess(wrong)).headers().location).toContain("error=TooManyCodes");
    // The real code is cancelled too.
    expect((await guess(code)).headers().location).toContain("error=TooManyCodes");
  });

  test("private pages send signed-out visitors to sign in", async ({ page }) => {
    await page.goto("/startups");
    await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fstartups$/);
    await expect(page.getByRole("heading", { name: "Sign in to BluSlate" })).toBeVisible();
  });

  test("one account can't open another account's startup", async ({ page, browser }) => {
    await onboardAsRiya(page);
    const cityUrl = page.url();
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto(cityUrl);
    await expect(otherPage).toHaveURL(/\/signin/);
    await other.close();
  });

  test("saving a startup needs an account", async ({ request }) => {
    const res = await request.post("/api/startups", {
      data: {
        path: "new-idea",
        firstName: "Riya",
        details: { mode: "idea", idea: "E-bikes", city: "Pune", country: "IN" },
      },
    });
    expect(res.status()).toBe(401);
  });
});
