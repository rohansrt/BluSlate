import { expect, test, type Page } from "@playwright/test";
import { expectNoSidewaysScroll, onboardAsRiya, startupUrl } from "./helpers";

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
  test("every pillar opens from the step list with its own steps, goals, AI slots and report out", async ({
    page,
  }) => {
    await onboardAsRiya(page);
    for (const p of PILLARS) {
      await page.getByTestId(`rail-${p.id}`).click();
      await expect(page).toHaveURL(new RegExp(`/startups/[a-z0-9]+/${p.id}$`));
      await expect(page.getByText(p.question)).toBeVisible();
      // Section headings read "<step> <title>".
      await expect(
        page.getByRole("heading", {
          name: new RegExp(`^\\d* ?${p.first.replace(/[?&]/g, "\\$&")}$`),
        }),
      ).toBeVisible();
      await expect(page.getByTestId("goals")).toBeVisible();
      await expect(page.getByTestId("goals-count")).toContainText(/\d+ of \d+ complete/);
      await expect(page.getByTestId("report-out")).toBeVisible();
      await expect(page.getByTestId("ai-placeholder").first()).toBeVisible();
      await expectNoSidewaysScroll(page);
    }
  });

  test("Problem Discovery parks the idea, builds the statement, autosaves and fills in later steps", async ({
    page,
  }) => {
    await onboardAsRiya(page);
    const base = startupUrl(page);
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

    // Shared facts are filled into the linked fields of later steps before any publish.
    await page.goto(`${base}/market`);
    await expect(page.getByLabel("Segment", { exact: true })).toHaveValue(
      "College students in Pune who live far from campus",
    );

    await page.goto(`${base}/discover`);
    await page.getByRole("button", { name: "Review and publish" }).click();
    await expect(page.getByText("You're approving:")).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(/Published 1 item/)).toBeVisible({ timeout: 15_000 });

    await page.goto(`${base}/customers`);
    await expect(page.getByText("From Problem Discovery:")).toBeVisible();
    await expect(page.getByLabel("Segment", { exact: true }).first()).toHaveValue(
      "College students in Pune who live far from campus",
    );
  });

  test("Market Research fills TAM, SAM and SOM, and its goals turn the step amber", async ({
    page,
  }) => {
    await onboardAsRiya(page);
    await page.goto(`${startupUrl(page)}/market`);
    await expect(page.getByTestId("rail-market")).toHaveAttribute("data-progress", "empty");
    await expect(page.getByTestId("goal-tam")).toHaveText("—");
    await page.getByLabel("Potential customers", { exact: true }).fill("50000");
    await page.getByLabel("Yearly value per customer", { exact: true }).fill("12000");
    await expect(page.getByTestId("goal-tam")).toHaveText("₹60 crore");
    await expect(page.locator('[data-goal="tam"]')).toHaveAttribute("data-done", "true");
    await expect(page.getByTestId("rail-market")).toHaveAttribute("data-progress", "partial");
    await expect(page.getByTestId("goal-sam")).toHaveText("—");
    await page.getByLabel("Reach", { exact: true }).fill("20");
    await page.getByLabel("Win share", { exact: true }).fill("5");
    await expect(page.getByTestId("goal-sam")).toHaveText("₹12 crore");
    await expect(page.getByTestId("goal-som")).toHaveText("₹60 lakh");
  });

  test("the launch market is one answer shared by Customer Discovery and Market Research", async ({
    page,
  }) => {
    await onboardAsRiya(page);
    const base = startupUrl(page);
    await page.goto(`${base}/customers`);
    const card = page.getByTestId("target-market");
    await card.getByLabel("Country").selectOption("GB");
    await expect(card.getByText("Saved for both steps")).toBeVisible({ timeout: 10_000 });
    await page.goto(`${base}/market`);
    await expect(page.getByTestId("target-market").getByLabel("Country")).toHaveValue("GB");
    await expect(page.getByTestId("market-place")).toHaveText("United Kingdom");
    await page.getByLabel("Potential customers", { exact: true }).fill("1000");
    await page.getByLabel("Yearly value per customer", { exact: true }).fill("100");
    await expect(page.getByTestId("goal-tam")).toHaveText("£100K");
  });

  test("Launch & Growth runs the months once it has starting numbers", async ({ page }) => {
    await onboardAsRiya(page);
    await page.goto(`${startupUrl(page)}/run-grow`);
    await expect(page.getByText(/to run the months/)).toBeVisible();
    await page.getByLabel("Starting cash", { exact: true }).fill("500000");
    await page.getByLabel("Price", { exact: true }).fill("1000");
    await page.getByLabel("CAC", { exact: true }).fill("400");
    await page.getByLabel("Marketing budget", { exact: true }).fill("20000");
    await page.getByLabel("Fixed monthly", { exact: true }).fill("60000");
    await expect(page.getByTestId("goal-runway")).not.toHaveText("—");
    await expect(page.getByRole("table")).toBeVisible();
    // All of its goals are met: the step and its Passport stamp turn green.
    await expect(page.getByTestId("rail-run-grow")).toHaveAttribute("data-progress", "complete");
    await expect(page.getByTestId("passport-count")).toHaveText("1/7");
    await expectNoSidewaysScroll(page);
  });

  test("the Passport shows a stamp per step, and each stamp opens its step", async ({ page }) => {
    await onboardAsRiya(page);
    await page
      .getByTestId("passport")
      .getByRole("button", { name: /Passport/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "Startup Passport" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-stamp]")).toHaveCount(7);
    await dialog.getByTestId("stamp-gtm").click();
    await expect(page).toHaveURL(/\/gtm$/);
    await expect(page.getByRole("dialog", { name: "Startup Passport" })).toHaveCount(0);
  });

  test("any step can be skipped, and the step list moves between them", async ({ page }) => {
    await onboardAsRiya(page);
    await page.getByTestId("skip-step").click();
    await expect(page).toHaveURL(/\/customers$/);
    await page.getByTestId("next-step").click();
    await expect(page).toHaveURL(/\/market$/);
    const rail = page.getByRole("navigation", { name: "Your steps" });
    await expect(page.getByTestId("rail-market")).toHaveAttribute("aria-current", "page");
    await rail.getByTestId("rail-docs").click();
    await expect(page).toHaveURL(/\/pack$/);
  });

  test("Pitch docs: generate one, choose how to fill gaps, then download it", async ({ page }) => {
    await onboardAsRiya(page);
    await page.goto(`${startupUrl(page)}/pack`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("8 · Pitch docs");
    for (const kind of ["summary", "deck", "plan", "canvas", "financials"]) {
      await expect(page.getByTestId(`download-${kind}`)).toBeDisabled();
    }
    await page.getByTestId("generate-summary").click();
    // Steps aren't complete: the founder chooses AI predictions or only their own work.
    const dialog = page.getByTestId("gap-dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByTestId("gap-own").click();
    await expect(page.getByTestId("doc-summary-status")).toContainText("Generated", {
      timeout: 20_000,
    });
    const download = page.getByTestId("download-summary");
    await expect(download).toHaveAttribute("href", /\/docs\/summary/);
    const res = await page.request.get((await download.getAttribute("href"))!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("application/pdf");
    expect((await res.body()).subarray(0, 4).toString()).toBe("%PDF");
    await expect(page.getByTestId("rail-docs")).toHaveAttribute("data-progress", "partial");

    await page.getByTestId("generate-all").click();
    await page.getByTestId("gap-dialog").getByTestId("gap-own").click();
    await expect(page.getByTestId("doc-financials-status")).toContainText("Generated", {
      timeout: 30_000,
    });
    const xlsx = await page.request.get(
      (await page.getByTestId("download-financials").getAttribute("href"))!,
    );
    expect(xlsx.headers()["content-type"]).toContain("spreadsheetml");
    await expectNoSidewaysScroll(page);
  });

  test("an unknown pillar is a 404", async ({ page }) => {
    await onboardAsRiya(page);
    const res = await page.goto(`${startupUrl(page)}/not-a-pillar`);
    expect(res?.status()).toBe(404);
  });
});
