import { expect, test, type Page } from "@playwright/test";
import { expectNoSidewaysScroll, onboardAsRiya } from "./helpers";

/** Pillars v1 (decision 0006): every pillar is usable alone, with live goals and a report out. */

const PILLARS = [
  {
    id: "discover",
    name: "Problem Discovery",
    question: "What problem is worth solving?",
    first: "The problem",
  },
  {
    id: "customers",
    name: "Customer Discovery",
    question: "Who has the problem, and what is the evidence?",
    first: "Who has it?",
  },
  {
    id: "market",
    name: "Market Research",
    question: "How big, reachable and contested is it?",
    first: "Size it from the bottom up",
  },
  {
    id: "build",
    name: "Product Design",
    question: "What exactly should exist?",
    first: "Value proposition",
  },
  {
    id: "setup",
    name: "Operations Setup",
    question: "How will it be delivered?",
    first: "What you deliver, step by step",
  },
  {
    id: "gtm",
    name: "Go-to-Market Plan",
    question: "Who buys first, at what price, through which channels?",
    first: "Pricing Lab",
  },
  {
    id: "run-grow",
    name: "Launch & Growth",
    question: "What happens over time?",
    first: "Control room",
  },
];

async function waitSaved(page: Page) {
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10_000 });
}

test.describe("Pillars v1", () => {
  test("every pillar opens from the city with its own steps, goals, AI slots and report out", async ({
    page,
  }) => {
    await onboardAsRiya(page);
    const city = page.url();
    for (const [i, p] of PILLARS.entries()) {
      await page.goto(city);
      await page
        .getByRole("list", { name: "City hubs" })
        .getByRole("link", { name: `${i + 1}. ${p.name}` })
        .click();
      await expect(page).toHaveURL(new RegExp(`/startups/[a-z0-9]+/${p.id}$`));
      await expect(page.getByText(p.question)).toBeVisible();
      // Section headings read "<step> <title>".
      await expect(
        page.getByRole("heading", {
          name: new RegExp(`^\\d* ?${p.first.replace(/[?&]/g, "\\$&")}$`),
        }),
      ).toBeVisible();
      await expect(page.getByTestId("goals")).toBeVisible();
      await expect(page.getByTestId("report-out")).toBeVisible();
      await expect(page.getByTestId("ai-placeholder").first()).toBeVisible();
      await expectNoSidewaysScroll(page);
    }
  });

  test("Problem Discovery parks the idea, builds the statement, autosaves and publishes to Customer Discovery", async ({
    page,
  }) => {
    await onboardAsRiya(page);
    const city = page.url();
    await page.goto(`${city}/discover`);
    await expect(page.getByLabel("Parked solution")).toHaveValue(
      "Cheaper e-bike rentals for students",
    );

    await page
      .getByLabel("The problem", { exact: true })
      .fill("lose time and money getting to class");
    await page.getByLabel("Who has it").fill("College students in Pune who live far from campus");
    await page.getByRole("radio", { name: "Most days" }).click();
    await expect(page.getByTestId("problem-statement")).toContainText(
      "College students in Pune who live far from campus lose time and money getting to class almost every day.",
    );
    await expect(page.getByTestId("goal-strength")).toHaveText(/3 of 6 checks/);
    await waitSaved(page);

    await page.reload();
    await expect(page.getByLabel("Who has it")).toHaveValue(
      "College students in Pune who live far from campus",
    );

    await page.getByRole("button", { name: "Review and publish" }).click();
    await expect(page.getByText("You're approving:")).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(/Published 1 item/)).toBeVisible({ timeout: 15_000 });

    await page.goto(`${city}/customers`);
    await expect(page.getByText("From Problem Discovery:")).toBeVisible();
    await expect(page.getByLabel("Segment", { exact: true }).first()).toHaveValue(
      "College students in Pune who live far from campus",
    );
  });

  test("Market Research fills TAM, SAM and SOM as soon as they can be calculated", async ({
    page,
  }) => {
    await onboardAsRiya(page);
    await page.goto(`${page.url()}/market`);
    await expect(page.getByTestId("goal-tam")).toHaveText("—");
    await page.getByLabel("Potential customers", { exact: true }).fill("50000");
    await page.getByLabel("Yearly value per customer", { exact: true }).fill("12000");
    await expect(page.getByTestId("goal-tam")).toHaveText("₹60 crore");
    await expect(page.getByTestId("goal-sam")).toHaveText("—");
    await page.getByLabel("Reach", { exact: true }).fill("20");
    await page.getByLabel("Win share", { exact: true }).fill("5");
    await expect(page.getByTestId("goal-sam")).toHaveText("₹12 crore");
    await expect(page.getByTestId("goal-som")).toHaveText("₹60 lakh");
  });

  test("Launch & Growth runs the months once it has starting numbers", async ({ page }) => {
    await onboardAsRiya(page);
    await page.goto(`${page.url()}/run-grow`);
    await expect(page.getByText(/to run the months/)).toBeVisible();
    await page.getByLabel("Starting cash", { exact: true }).fill("500000");
    await page.getByLabel("Price", { exact: true }).fill("1000");
    await page.getByLabel("CAC", { exact: true }).fill("400");
    await page.getByLabel("Marketing budget", { exact: true }).fill("20000");
    await page.getByLabel("Fixed monthly", { exact: true }).fill("60000");
    await expect(page.getByTestId("goal-runway")).not.toHaveText("—");
    await expect(page.getByRole("table")).toBeVisible();
    await expectNoSidewaysScroll(page);
  });

  test("the Founder Pack report has a block for every pillar", async ({ page }) => {
    await onboardAsRiya(page);
    await page.goto(`${page.url()}/pack`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const p of PILLARS) await expect(page.getByTestId(`pack-${p.id}`)).toBeVisible();
    await expect(page.getByRole("button", { name: /Print or save as PDF/ })).toBeVisible();
    await expectNoSidewaysScroll(page);
  });

  test("the hub rail moves between pillars and marks the current one", async ({ page }) => {
    await onboardAsRiya(page);
    await page.goto(`${page.url()}/discover`);
    const rail = page.getByRole("navigation", { name: "City hubs" });
    await expect(rail.getByRole("link", { name: /1 Problem Discovery/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await rail.getByRole("link", { name: /3 Market Research/ }).click();
    await expect(page).toHaveURL(/\/market$/);
    await expect(rail.getByRole("link", { name: /3 Market Research/ })).toHaveAttribute(
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
