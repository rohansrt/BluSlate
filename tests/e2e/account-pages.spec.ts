import { expect, test } from "@playwright/test";
import { completeWelcome, onboardAsRiya, signInByEmail, uniqueEmail } from "./helpers";

/** The seven-step circle, Product Overview and the account pages (docs/decisions/0011). */

test.describe("Seven-step circle", () => {
  test("Start in the centre opens the onboarding card beside the circle, sharing the draft", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.getByTestId("onboarding-card");
    await hero.getByLabel("Your first name").fill("Kabir");
    await page.getByTestId("circle-start").click();
    const circleCard = page.getByTestId("onboarding-card-circle");
    await expect(circleCard).toBeVisible();
    // The same draft: the name typed in the hero card is already there.
    await expect(circleCard.getByLabel("Your first name")).toHaveValue("Kabir");
    await circleCard.getByLabel("Your age").fill("19");
    await circleCard.getByRole("button", { name: "Continue" }).click();
    await expect(circleCard.getByTestId("onboarding-step-title")).toHaveText(
      "Where are you starting?",
    );
    await expect(hero.getByTestId("onboarding-step-title")).toHaveText("Where are you starting?");
  });

  test("Try this pillar starts with that pillar as the one tool", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Step 3: Market Research" }).click();
    await page.getByTestId("step-brief").getByRole("button", { name: "Try this pillar" }).click();
    const circleCard = page.getByTestId("onboarding-card-circle");
    await circleCard.getByLabel("Your first name").fill("Kabir");
    await circleCard.getByLabel("Your age").fill("19");
    await circleCard.getByRole("button", { name: "Continue" }).click();
    await expect(circleCard.getByLabel("I just want one tool")).toBeChecked();
    await circleCard.getByRole("button", { name: "Continue" }).click();
    await expect(circleCard.getByRole("radio", { name: /3 · Market Research/ })).toBeChecked();
  });

  test("Pitch comes after step 7, with investors coming soon", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Then: Pitch" }).click();
    const brief = page.getByTestId("step-brief");
    await expect(brief.getByRole("heading", { name: "Pitch" })).toBeVisible();
    await expect(brief).toContainText("Coming soon");
    await expect(brief).toContainText("10 in your country and up to 5 global");
  });

  test("About shows the same circle as Product Overview, linking to Home", async ({ page }) => {
    await page.goto("/about");
    const overview = page.getByTestId("product-overview");
    await expect(overview.getByRole("heading", { name: "Product Overview" })).toBeVisible();
    await expect(overview.getByRole("tab", { name: "Then: Pitch" })).toBeVisible();
    await overview.getByTestId("circle-start").click();
    await expect(page).toHaveURL(/\/\?start=1#journey$/);
    await expect(page.getByTestId("onboarding-card-circle")).toBeVisible();
  });
});

test.describe("Account pages", () => {
  test("the profile menu lists the account pages in order", async ({ page }) => {
    await onboardAsRiya(page);
    await page.getByRole("button", { name: /Account menu for Riya/ }).click();
    const items = await page
      .getByRole("menu", { name: "Account" })
      .getByRole("menuitem")
      .allTextContents();
    expect(items.map((t) => t.trim())).toEqual([
      "My startups",
      "Collaborate",
      "Consult",
      "Idea Book",
      "Feedback",
      "Profile",
      "Log out",
    ]);
  });

  test("Idea Book saves your own ideas and suggested ones", async ({ page }) => {
    await onboardAsRiya(page);
    await page.goto("/ideas");
    await page.getByLabel("A new idea").fill("Solar charging kiosks at bus stops");
    await page.getByRole("button", { name: "Save idea" }).click();
    const list = page.getByTestId("idea-list");
    await expect(list).toContainText("Solar charging kiosks at bus stops");
    await page.getByRole("button", { name: "Save", exact: true }).first().click();
    await expect(list.getByText("picked from suggestions")).toBeVisible();
  });

  test("friends: a request by email shows up for that person, who accepts it", async ({
    page,
    browser,
  }, testInfo) => {
    const asha = uniqueEmail(`asha-${testInfo.project.name}`);
    // Asha signs up first, so she has an account.
    const ashaContext = await browser.newContext();
    const ashaPage = await ashaContext.newPage();
    await signInByEmail(ashaPage, asha);
    await completeWelcome(ashaPage, "Asha", "21");

    await onboardAsRiya(page);
    await page.goto("/collaborate");
    await page.getByLabel("Your friend's email").fill(asha);
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText(`Request sent. If ${asha} uses BluSlate`)).toBeVisible();

    await ashaPage.goto("/collaborate");
    const incoming = ashaPage.getByTestId("incoming-requests");
    await expect(incoming).toContainText("Riya");
    await incoming.getByRole("button", { name: "Accept" }).click();
    await expect(ashaPage.getByTestId("friends")).toContainText("Riya");

    await page.reload();
    await expect(page.getByTestId("friends")).toContainText(asha);
    await ashaContext.close();
  });

  test("Consult takes a request and offers WhatsApp", async ({ page }) => {
    await page.goto("/consult");
    await expect(page.getByTestId("whatsapp-link")).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/918979484758/,
    );
    await page.getByLabel("Your name").fill("Riya");
    await page.getByLabel("Contact number").fill("+91 98765 43210");
    await page.getByLabel("Your email").fill(uniqueEmail("consult"));
    await page.getByLabel("How can we help?").fill("I need help pricing my e-bike rentals.");
    await page.getByRole("button", { name: "Send my request" }).click();
    await expect(page.getByTestId("consult-done")).toContainText("We'll reach out soon");
  });

  test("Feedback takes multiple-choice answers and a note", async ({ page }) => {
    await page.goto("/feedback");
    const form = page.getByTestId("feedback-form");
    await form.getByText("The seven-step journey").click();
    await form.getByText("Using it on a phone").click();
    await form.getByText("Very useful").click();
    await form.getByText("AI help in each step").click();
    await form.getByText("9", { exact: true }).click();
    await form.getByLabel(/Anything else/).fill("Love the circle!");
    await form.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByText("Thank you! Your feedback helps us")).toBeVisible();
  });
});
