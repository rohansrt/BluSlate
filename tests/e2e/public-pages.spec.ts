import { expect, test } from "@playwright/test";
import { expectNoSidewaysScroll } from "./helpers";

test.describe("Public pages", () => {
  test("Home opens with the hook and the seven steps as a clickable loop", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Will it work?");

    await expectNoSidewaysScroll(page);
    const steps = page.getByRole("tablist", { name: "The seven steps" });
    await expect(steps.getByRole("tab")).toHaveCount(7);
    const brief = page.getByTestId("step-brief");
    await expect(steps.getByRole("tab", { name: "Step 1: Discover" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(brief).toContainText("What problem is worth solving?");

    await steps.getByRole("tab", { name: "Step 6: Go to Market" }).click();
    await expect(brief).toContainText("Who buys first, at what price, through which channels?");
    await expect(brief).toContainText("You get: A launch plan and sales funnel");

    // Keyboard: the arrow keys move around the loop, and Run & Grow wraps to Discover.
    await page.keyboard.press("ArrowRight");
    await expect(steps.getByRole("tab", { name: "Step 7: Run & Grow" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(brief).toContainText("What problem is worth solving?");
  });

  test("About renders every section the spec lists", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const heading of [
      "What BluSlate is",
      "Who it's for",
      "The seven steps",
      "How a journey works",
      "How we use AI, and what it never does",
      "Real vs simulated",
      "Privacy",
      "Part of the YOPPI family",
      "Contact",
    ]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "founder@yoppi.in" })).toHaveAttribute(
      "href",
      "mailto:founder@yoppi.in",
    );
    for (const label of ["ACTUAL", "FIELD", "SOURCED", "ASSUMED", "ESTIMATE", "SYNTHETIC"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  for (const [path, title] of [
    ["/privacy", "Privacy Policy"],
    ["/terms", "Terms of Use"],
    ["/cookies", "Cookie Policy"],
  ] as const) {
    test(`${title} renders with a canonical link`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${path}$`),
      );
    });
  }

  test("SEO files are served", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain("/about");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /startups");
    expect(robots).toContain("Sitemap:");
  });
});
