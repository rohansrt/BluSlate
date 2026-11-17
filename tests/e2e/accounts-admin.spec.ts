import { expect, test } from "@playwright/test";
import { onboardAsRiya, signInByEmail, uniqueEmail } from "./helpers";

test.describe("Accounts", () => {
  test("visitors can continue as a guest from the sign-in page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Sign up" }).click();
    await expect(page.getByRole("heading", { name: "Create your BluSlate account" })).toBeVisible();
    await page.getByRole("button", { name: "Continue as guest" }).click();
    await expect(page).toHaveURL(/\/startups\/new$/);
    await expect(page.getByTestId("onboarding-step-title")).toHaveText("What should we call you?");
    await expect(page.getByRole("button", { name: /Account menu for Guest/ })).toBeVisible();
  });

  test("the profile menu sits at the top right", async ({ page }) => {
    await onboardAsRiya(page);
    await page.getByRole("button", { name: /Account menu for Riya/ }).click();
    const menu = page.getByRole("menu", { name: "Account" });
    await expect(menu.getByRole("menuitem", { name: "My startups" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Sign up to keep your work" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "End guest session" })).toBeVisible();
    await menu.getByRole("menuitem", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByLabel("Your first name")).toHaveValue("Riya");
  });

  test("a guest who signs up keeps their startups", async ({ page }, testInfo) => {
    await onboardAsRiya(page);
    const email = uniqueEmail(`upgrade-${testInfo.project.name}`);
    await signInByEmail(page, email, "/signin?mode=signup");
    await expect(page).toHaveURL(/\/startups$/, { timeout: 20_000 });
    await expect(page.getByRole("link", { name: /Riya's idea/ })).toBeVisible();
    await page.goto("/profile");
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

    await signInByEmail(page, uniqueEmail(`not-admin-${testInfo.project.name}`), "/admin/login");
    await page.goto("/admin");
    await expect(page.getByTestId("no-admin-access")).toBeVisible();
  });

  test("an admin sees statistics and can plug in a model", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Shared model state: run once.");
    test.setTimeout(90_000);
    await signInByEmail(page, "admin@example.test", "/admin/login");
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
