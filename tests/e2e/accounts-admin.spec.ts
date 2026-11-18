import { expect, test } from "@playwright/test";
import { codeFor, onboardAsRiya, signInByEmail, uniqueEmail } from "./helpers";

/**
 * Admin sign-in uses a password, which is never stored in the repo. CI sets a
 * test-only pair; locally, run with E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@example.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("Accounts", () => {
  test("a guest gives a name and email, onboards, then signs in with a code and keeps the work", async ({
    page,
  }, testInfo) => {
    const email = uniqueEmail(`guest-${testInfo.project.name}`);
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to BluSlate" })).toBeVisible();
    // The code form comes first; the guest option sits below it.
    await expect(page.getByRole("button", { name: "Email me a code" })).toBeVisible();
    const guest = page.getByTestId("guest-form");
    await guest.getByLabel("Your first name").fill("Asha");
    await guest.getByLabel("Your email").fill(email);
    await guest.getByRole("button", { name: "Continue as guest" }).click();

    // Home's onboarding already knows the name, so it starts at step 2 of 3.
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    const card = page.getByTestId("onboarding-card");
    await expect(card.getByText("Step 2 of 3")).toBeVisible();
    await card.getByText("I have a new idea").click();
    await card.getByRole("button", { name: "Continue" }).click();
    await card.getByLabel("Your idea in one sentence").fill("Tiffin delivery for hostels");
    await card.getByLabel("City").fill("Indore");
    await card.getByRole("button", { name: "Open my city" }).click();
    await expect(page).toHaveURL(/\/startups\/(?!new$)[a-z0-9]+$/, { timeout: 30_000 });
    await expect(page.getByTestId("city-title")).toHaveText("Asha's idea");
    await expect(page.getByText("This is a guest workspace")).toBeVisible();

    await page.goto("/profile");
    await expect(page.getByTestId("profile-guest-email")).toContainText(email);

    // Signing in with a code keeps the guest's startup; the email is pre-filled.
    await page.goto("/signin?mode=signup");
    await expect(page.getByRole("heading", { name: "Keep your startups" })).toBeVisible();
    await expect(page.getByTestId("guest-form")).toHaveCount(0);
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
    await page.getByRole("button", { name: "Email me a code" }).click();
    await page.getByLabel(/6.digit code/).fill(await codeFor(email));
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("city-title")).toHaveText("Asha's idea", { timeout: 20_000 });
    await expect(page.getByText("This is a guest workspace")).toHaveCount(0);
    await page.goto("/profile");
    await expect(page.getByTestId("profile-email")).toContainText(email);
  });

  test("the profile menu sits at the top right", async ({ page }) => {
    const email = await onboardAsRiya(page);
    await page.getByRole("button", { name: /Account menu for Riya/ }).click();
    const menu = page.getByRole("menu", { name: "Account" });
    await expect(menu.getByText(email)).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "My startups" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Sign up to keep your work" })).toHaveCount(0);
    await menu.getByRole("menuitem", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByLabel("Your first name")).toHaveValue("Riya");
    await expect(page.getByTestId("profile-email")).toContainText(email);
  });

  test("an owner can delete a startup and everything in it", async ({ page }) => {
    await onboardAsRiya(page);
    const startupId = new URL(page.url()).pathname.split("/").pop()!;
    await page.goto("/startups");
    await page.getByRole("button", { name: "Delete Riya's idea" }).click();
    await page.getByRole("button", { name: "Delete forever" }).click();
    await expect(
      page.getByText("Deleted. That startup and everything in it is gone."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Riya's idea/ })).toHaveCount(0);
    expect((await page.request.get(`/api/startups/${startupId}/twin`)).status()).toBe(404);
  });
});

test.describe("Admin", () => {
  test.describe.configure({ mode: "serial" });

  test("admin pages need an admin sign-in", async ({ page }, testInfo) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);

    // Wrong password, and a non-admin email: the same message, no session.
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Wrong email or password.")).toBeVisible();
    await page.getByLabel("Email").fill("someone@example.test");
    await page.getByLabel("Password").fill(ADMIN_PASSWORD ?? "x");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Wrong email or password.")).toBeVisible();

    // A signed-in founder who isn't an admin sees "No admin access".
    await signInByEmail(page, uniqueEmail(`not-admin-${testInfo.project.name}`), "/signin");
    await page.goto("/admin");
    await expect(page.getByTestId("no-admin-access")).toBeVisible();
  });

  test("an admin sees statistics and can plug in a model", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Shared model state: run once.");
    test.skip(
      !ADMIN_PASSWORD,
      "Set E2E_ADMIN_PASSWORD (and E2E_ADMIN_EMAIL) to run the admin tests.",
    );
    test.setTimeout(90_000);
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
    await expect(page.getByTestId("admin-stats")).toContainText("Startups");
    await expect(page.getByRole("button", { name: /Account menu/ })).toBeVisible();

    // Start from an empty registry.
    await page.goto("/admin/models");
    while ((await page.getByRole("button", { name: "Remove" }).count()) > 0) {
      await page.getByRole("button", { name: "Remove" }).first().click();
      await page.waitForLoadState("networkidle");
    }
    await expect(page.getByTestId("models-empty")).toContainText("No AI models added yet");

    // Add a model: pick it, test the connection, save.
    await page.getByRole("link", { name: "Add your first model" }).click();
    const form = page.getByTestId("add-model-form");
    await form.getByRole("radio", { name: /Claude Haiku 5.5/ }).check();
    await expect(form.getByLabel("Name shown in the dashboard")).toHaveValue("Claude Haiku 5.5");
    await form.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByTestId("model-test-result")).toBeVisible();
    await form.getByRole("button", { name: "Add model" }).click();

    await expect(page).toHaveURL(/\/admin\/models\?added=claude-haiku-5-5/);
    await expect(page.getByTestId("model-claude-haiku-5-5")).toBeVisible();
    // It became the default Fast model for every pillar.
    await expect(page.getByLabel("Default (every pillar), Fast tier")).toHaveValue(/.+/);

    // Every action is in the audit log.
    await page.goto("/admin/audit");
    await expect(page.getByText("model.create").first()).toBeVisible();

    // Clean up.
    await page.goto("/admin/models");
    await page
      .getByTestId("model-claude-haiku-5-5")
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(page.getByTestId("models-empty")).toBeVisible();
  });
});
