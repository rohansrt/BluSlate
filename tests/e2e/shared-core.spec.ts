import { expect, test, type Page } from "@playwright/test";
import { onboardAsRiya } from "./helpers";

const ANSWERS: { id: string; name: string; answer: string }[] = [
  {
    id: "discover",
    name: "Discover",
    answer: "Students far from campus lose time and money getting to class",
  },
  { id: "customers", name: "Customers", answer: "Second-year students living 3-8 km from campus" },
  { id: "market", name: "Market", answer: "City bus pass" },
  { id: "build", name: "Build", answer: "Book a charged bike in under a minute" },
  { id: "setup", name: "Set Up", answer: "Fleet and maintenance lead" },
  { id: "gtm", name: "Go to Market", answer: "Always charged, cheaper than a daily bus pass" },
  { id: "run-grow", name: "Run & Grow", answer: "What if we cut the monthly price?" },
];

/** Answer a pillar's first question with "I'll decide", review, and approve. */
async function publishAnswer(page: Page, answer: string) {
  const starter = page.getByTestId("starter");
  await starter.getByLabel("Your answer").fill(answer);
  await starter.getByRole("button", { name: "Review and publish" }).click();
  const panel = page.getByTestId("publish-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByText("ASSUMED", { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "Approve and publish" }).click();
  await expect(page.getByTestId("current-value")).toHaveText(answer);
}

test.describe("Shared core (S3 exit gate)", () => {
  test("a manual value can be published in every pillar, and the city shows it", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await onboardAsRiya(page);
    const city = page.url();

    for (const p of ANSWERS) {
      await page.goto(`${city}/${p.id}`);
      await expect(page.getByTestId("starter")).toBeVisible();
      await publishAnswer(page, p.answer);
      // The founder's decision carries its evidence label.
      await expect(
        page.locator('[data-card="decision"]').getByText("ASSUMED", { exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByRole("navigation", { name: "City hubs" })
          .locator(`a[href$="/${p.id}"] [data-status]`),
      ).toHaveAttribute("data-status", "approved");
    }

    await page.goto(city);
    const hubs = page.getByRole("list", { name: "City hubs" });
    await expect(hubs.getByText("Approved", { exact: true })).toHaveCount(7);
    await expect(hubs.getByText("Not started", { exact: true })).toHaveCount(0);
  });

  test("changing an answer adds a version; a saved draft shows as a draft", async ({ page }) => {
    await onboardAsRiya(page);
    const city = page.url();
    await page.goto(`${city}/discover`);
    await publishAnswer(page, "Students are late to class");

    await page.getByRole("button", { name: "Change it" }).click();
    await publishAnswer(page, "Students are late and spend too much on autos");
    await expect(page.locator('[data-card="decision"]')).toContainText("Version 2");

    // A draft that isn't published yet doesn't change the decision, and the hub shows "Draft".
    await page.getByRole("button", { name: "Change it" }).click();
    await page.getByTestId("starter").getByLabel("Your answer").fill("Something new");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved.")).toBeVisible();
    await page.goto(city);
    await expect(
      page.getByRole("list", { name: "City hubs" }).getByText("Draft", { exact: true }),
    ).toBeVisible();
  });

  test("Guide me falls back to the manual path when AI isn't connected", async ({ page }) => {
    test.skip(Boolean(process.env.ANTHROPIC_API_KEY), "Only meaningful without an API key.");
    await onboardAsRiya(page);
    await page.goto(`${page.url()}/market`);
    await page.getByRole("radio", { name: /Guide me/ }).click();
    const rail = page.getByTestId("ai-rail");
    await expect(rail.getByText("The AI helper isn't available")).toBeVisible();
    await expect(page.getByTestId("starter").getByLabel(/Your answer/)).toBeEditable();
    // Research & suggest is not offered yet.
    await expect(page.getByRole("radio", { name: /Research & suggest/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("the Twin can't be written without a session, or across startups", async ({
    page,
    request,
    browser,
  }) => {
    await onboardAsRiya(page);
    const startupId = new URL(page.url()).pathname.split("/").pop()!;

    // No session at all: refused.
    const anon = await request.put(`/api/startups/${startupId}/pillars/discover/draft`, {
      data: { value: "x" },
    });
    expect(anon.status()).toBe(401);
    const anonPublish = await request.post(`/api/startups/${startupId}/pillars/discover/publish`, {
      data: { draftId: "anything" },
    });
    expect(anonPublish.status()).toBe(401);

    // Another browser with its own workspace: the first startup doesn't exist for it.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await onboardAsRiya(otherPage);
    const cross = await otherPage.request.put(`/api/startups/${startupId}/pillars/discover/draft`, {
      data: { value: "x" },
    });
    expect(cross.status()).toBe(404);
    const read = await otherPage.request.get(`/api/startups/${startupId}/twin`);
    expect(read.status()).toBe(404);
    await other.close();
  });
});
