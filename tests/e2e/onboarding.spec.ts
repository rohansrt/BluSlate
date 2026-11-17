import { expect, test } from "@playwright/test";
import { magicLinkFor, uniqueEmail } from "./helpers";

test.describe("Home onboarding (S1 exit gate)", () => {
  test("a new founder completes onboarding, signs in by email link and lands in an empty city", async ({
    page,
  }, testInfo) => {
    const email = uniqueEmail(testInfo.project.name);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Test a business idea before you spend real money on it.",
    );

    const card = page.getByTestId("onboarding-card");
    const title = page.getByTestId("onboarding-step-title");

    // 1. Name
    await expect(title).toHaveText("What should we call you?");
    const next = card.getByRole("button", { name: "Continue" });
    await expect(next).toBeDisabled();
    await card.getByLabel("Your first name").fill("Riya");
    await next.click();

    // 2. Where are you starting?
    await expect(title).toHaveText("Where are you starting?");
    await card.getByText("I have a new idea").click();
    await next.click();

    // 3. The idea, city and country
    await expect(title).toHaveText("What's the idea?");
    await card.getByLabel("Your idea in one sentence").fill("Cheaper e-bike rentals for students");
    await expect(next).toBeDisabled();
    await card.getByLabel("City").fill("Pune");
    await card.getByLabel("Country").selectOption("IN");
    await next.click();

    // The draft survives a reload before sign-in.
    await expect(title).toHaveText("Save your startup");
    await page.reload();
    await expect(page.getByTestId("onboarding-step-title")).toHaveText("Save your startup");

    // 4. Sign in with email
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    // First visits compile on demand in dev, so allow time for the redirect chain.
    await expect(page).toHaveURL(/\/signin\/check-email/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

    // Open the magic link: the draft becomes a startup and we land in its city.
    await page.goto(await magicLinkFor(email));
    await expect(page).toHaveURL(/\/startups\/[a-z0-9]+$/, { timeout: 20_000 });
    await expect(page.getByTestId("city-title")).toHaveText("Riya's idea");
    await expect(page.getByText("Pune, India")).toBeVisible();
    await expect(page.getByText("Cheaper e-bike rentals for students")).toBeVisible();

    // An empty city: all seven hubs, none started, Discover suggested first.
    // getByRole skips the hidden layout (map on desktop, route list on mobile).
    const hubs = page.getByRole("list", { name: "City hubs" });
    await expect(hubs).toHaveCount(1);
    for (const name of [
      "Discover",
      "Customers",
      "Market",
      "Build",
      "Set Up",
      "Go to Market",
      "Run & Grow",
    ]) {
      await expect(hubs.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(hubs.getByText("Not started")).toHaveCount(6);
    await expect(hubs.getByText("Start here")).toHaveCount(1);

    // Coming back to Home shows "Welcome back" and the startup.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome back, Riya" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Riya's idea/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start another" })).toBeVisible();
  });

  test("signed-out visitors are sent to sign-in for private pages", async ({ page }) => {
    await page.goto("/startups");
    await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fstartups/);
    await expect(page.getByRole("heading", { name: "Sign in to BluSlate" })).toBeVisible();
  });

  test("the API refuses to create a startup without a session", async ({ request }) => {
    const res = await request.post("/api/startups", {
      data: { path: "one-tool", firstName: "X", details: { tool: "market", country: "IN" } },
    });
    expect(res.status()).toBe(401);
  });
});
