import { expect, test } from "@playwright/test";
import { onboardAsRiya, startupIdOf } from "./helpers";

test.describe("Shared core (S3 exit gate)", () => {
  test("the Twin can't be written without a session, or across startups", async ({
    page,
    request,
    browser,
  }) => {
    await onboardAsRiya(page);
    const startupId = startupIdOf(page);

    // No session at all: refused.
    const anon = await request.put(`/api/startups/${startupId}/pillars/discover/draft`, {
      data: { value: "x" },
    });
    expect(anon.status()).toBe(401);
    const anonPublish = await request.post(`/api/startups/${startupId}/pillars/discover/publish`, {
      data: { draftId: "anything" },
    });
    expect(anonPublish.status()).toBe(401);
    const anonWorkspace = await request.put(
      `/api/startups/${startupId}/pillars/discover/workspace`,
      {
        data: { data: {} },
      },
    );
    expect(anonWorkspace.status()).toBe(401);
    const anonWsPublish = await request.post(
      `/api/startups/${startupId}/pillars/discover/workspace/publish`,
    );
    expect(anonWsPublish.status()).toBe(401);

    // Another browser with its own workspace: the first startup doesn't exist for it.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await onboardAsRiya(otherPage);
    const cross = await otherPage.request.put(`/api/startups/${startupId}/pillars/discover/draft`, {
      data: { value: "x" },
    });
    expect(cross.status()).toBe(404);
    const crossWs = await otherPage.request.post(
      `/api/startups/${startupId}/pillars/discover/workspace/publish`,
    );
    expect(crossWs.status()).toBe(404);
    const read = await otherPage.request.get(`/api/startups/${startupId}/twin`);
    expect(read.status()).toBe(404);
    await other.close();
  });
});
