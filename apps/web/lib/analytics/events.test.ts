import { describe, expect, it } from "vitest";
import {
  ageSchema,
  cleanPath,
  eventBatchSchema,
  isBot,
  mayTrack,
  parseUserAgent,
  referrerHost,
} from "@/lib/analytics/events";
import { funnel } from "@/lib/analytics/funnel";
import { nps } from "@/lib/feedback";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const WINDOWS_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0";

describe("analytics events", () => {
  it("read device, browser and OS coarsely", () => {
    expect(parseUserAgent(IPHONE)).toEqual({ device: "mobile", browser: "Safari", os: "iOS" });
    expect(parseUserAgent(ANDROID_CHROME)).toEqual({
      device: "mobile",
      browser: "Chrome",
      os: "Android",
    });
    expect(parseUserAgent(MAC_CHROME)).toEqual({
      device: "desktop",
      browser: "Chrome",
      os: "macOS",
    });
    expect(parseUserAgent(WINDOWS_EDGE).browser).toBe("Edge");
  });

  it("skip bots, headless browsers and empty user agents", () => {
    expect(isBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("Mozilla/5.0 HeadlessChrome/126.0")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot(IPHONE)).toBe(false);
  });

  it("store paths without ids or query strings", () => {
    expect(cleanPath("/startups/cmwm2dx3k0038k36m2et89wuw/market?x=1")).toBe(
      "/startups/[id]/market",
    );
    expect(cleanPath("/startups/new")).toBe("/startups/new");
    expect(cleanPath("/?utm_source=insta")).toBe("/");
  });

  it("keep only the referring site, and drop our own", () => {
    expect(referrerHost("https://www.google.com/search?q=x", "bluslate.yoppi.in")).toBe(
      "google.com",
    );
    expect(referrerHost("https://bluslate.yoppi.in/about", "bluslate.yoppi.in")).toBeNull();
    expect(referrerHost("not a url", "bluslate.yoppi.in")).toBeNull();
  });

  it("never track people who said they are under 18", () => {
    expect(mayTrack(null)).toBe(true);
    expect(mayTrack(18)).toBe(true);
    expect(mayTrack(17)).toBe(false);
  });

  it("accept only known events with small labels", () => {
    const base = { visitorId: "abcd-1234-efgh", sessionId: "wxyz-9876-abcd", path: "/" };
    expect(eventBatchSchema.safeParse({ events: [{ ...base, name: "page_view" }] }).success).toBe(
      true,
    );
    expect(eventBatchSchema.safeParse({ events: [{ ...base, name: "made_up" }] }).success).toBe(
      false,
    );
    expect(
      eventBatchSchema.safeParse({
        events: [{ ...base, name: "circle_try", props: { stop: "x".repeat(81) } }],
      }).success,
    ).toBe(false);
  });

  it("allow every age from 5", () => {
    expect(ageSchema.safeParse("12").success).toBe(true);
    expect(ageSchema.safeParse("4").success).toBe(false);
    expect(ageSchema.safeParse("abc").success).toBe(false);
  });
});

describe("funnels and scores", () => {
  it("show each step's share of the start and the drop from the step before", () => {
    const stages = funnel([
      { label: "Visited", visitors: new Set(["a", "b", "c", "d"]) },
      { label: "Started", visitors: new Set(["a", "b"]) },
      { label: "Finished", visitors: new Set(["a"]) },
    ]);
    expect(stages.map((s) => [s.value, s.ofStart, s.dropFromPrev])).toEqual([
      [4, 100, null],
      [2, 50, 50],
      [1, 25, 50],
    ]);
  });

  it("compute NPS from 0–10 answers", () => {
    expect(nps([])).toBeNull();
    expect(nps([10, 9, 8, 3])).toBe(25);
  });
});
