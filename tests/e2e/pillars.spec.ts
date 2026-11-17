import { expect, test } from "@playwright/test";
import { expectNoSidewaysScroll, onboardAsRiya } from "./helpers";

const PILLARS = [
  {
    id: "discover",
    name: "Discover",
    question: "What problem is worth solving?",
    writes: "Problem",
  },
  {
    id: "customers",
    name: "Customers",
    question: "Who has the problem, and what is the evidence?",
    writes: "Persona",
  },
  {
    id: "market",
    name: "Market",
    question: "How big, reachable and contested is it?",
    writes: "MarketSize",
  },
  { id: "build", name: "Build", question: "What exactly should exist?", writes: "Offering" },
  { id: "setup", name: "Set Up", question: "How will it be delivered?", writes: "Enabler" },
  {
    id: "gtm",
    name: "Go to Market",
    question: "Who buys first, at what price, through which channels?",
    writes: "PricePlan",
  },
  { id: "run-grow", name: "Run & Grow", question: "What happens over time?", writes: "Scenario" },
];

test.describe("Pillar skeletons (S2 exit gate)", () => {
  test("every pillar's placeholder opens from the city", async ({ page }) => {
    await onboardAsRiya(page);
    const city = page.url();

    for (const [i, p] of PILLARS.entries()) {
      await page.goto(city);
      await page
        .getByRole("list", { name: "City hubs" })
        .getByRole("link", { name: `${i + 1}. ${p.name}` })
        .click();
      await expect(page).toHaveURL(new RegExp(`/startups/[a-z0-9]+/${p.id}$`));

      const screen = page.getByTestId(`pillar-placeholder-${p.id}`);
      await expect(screen.getByRole("heading", { name: p.question })).toBeVisible();
      await expect(
        screen.getByRole("list", { name: `${p.name} writes` }).getByText(p.writes, { exact: true }),
      ).toBeVisible();
      await expect(screen.getByRole("list", { name: `${p.name} reads` })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Work", selected: true })).toBeVisible();
      await expectNoSidewaysScroll(page);
    }
  });

  test("the hub rail moves between pillars and marks the current one", async ({ page }) => {
    await onboardAsRiya(page);
    await page.goto(`${page.url()}/discover`);
    const rail = page.getByRole("navigation", { name: "City hubs" });
    await expect(rail.getByRole("link", { name: /1 Discover/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await rail.getByRole("link", { name: /3 Market/ }).click();
    await expect(page).toHaveURL(/\/market$/);
    await expect(page.getByTestId("pillar-placeholder-market")).toBeVisible();
    await expect(rail.getByRole("link", { name: /3 Market/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("an unknown pillar is a 404", async ({ page }) => {
    await onboardAsRiya(page);
    const res = await page.goto(`${page.url()}/not-a-pillar`);
    expect(res?.status()).toBe(404);
  });
});
