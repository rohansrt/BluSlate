import { expect, test } from "@playwright/test";

test.describe("Public pages", () => {
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
