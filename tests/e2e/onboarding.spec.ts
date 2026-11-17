import { expect, test } from "@playwright/test";
import { magicLinkFor, onboardAsRiya, uniqueEmail } from "./helpers";

test.describe("Home onboarding (S1 exit gate, without sign-in)", () => {
  test("a new founder completes onboarding and lands in an empty city", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Got a business idea?Will it work?",
    );
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);

    await onboardAsRiya(page);
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

    // Coming back to Home shows "Welcome back" and the startup. Guests can't sign out.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome back, Riya" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Riya's idea/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start another" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  });

  test("private pages send visitors without a workspace back to Home", async ({ page }) => {
    await page.goto("/startups");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("onboarding-card")).toBeVisible();
  });

  test("one browser can't open another browser's startup", async ({ page, browser }) => {
    await onboardAsRiya(page);
    const cityUrl = page.url();
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto(cityUrl);
    await expect(otherPage).toHaveURL(/\/$/);
    await other.close();
  });

  test("the email sign-in page still works for later", async ({ page }, testInfo) => {
    const email = uniqueEmail(testInfo.project.name);
    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    // First visits compile on demand in dev, so allow time for the redirect.
    await expect(page).toHaveURL(/\/signin\/check-email/, { timeout: 20_000 });
    await page.goto(await magicLinkFor(email));
    await expect(page).toHaveURL(/\/startups$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "My startups" })).toBeVisible();
  });
});
