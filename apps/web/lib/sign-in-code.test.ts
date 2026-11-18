import { describe, expect, it } from "vitest";
import {
  formatCode,
  generateCode,
  hashCode,
  normalizeCode,
  normalizeEmail,
} from "@/lib/sign-in-code";

/** Auth.js's own hash (@auth/core lib/utils/web.js createHash), copied to pin the format. */
async function authJsHash(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

describe("sign-in codes", () => {
  it("are always six digits, leading zeros kept", () => {
    for (let i = 0; i < 2000; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("vary from one to the next", () => {
    const codes = new Set(Array.from({ length: 200 }, generateCode));
    expect(codes.size).toBeGreaterThan(190);
  });

  it("accept spaces and dashes as typed or pasted, and nothing else", () => {
    expect(normalizeCode("123456")).toBe("123456");
    expect(normalizeCode(" 123 456 ")).toBe("123456");
    expect(normalizeCode("123-456")).toBe("123456");
    expect(normalizeCode("012345")).toBe("012345");
    expect(normalizeCode("12345")).toBeNull();
    expect(normalizeCode("1234567")).toBeNull();
    expect(normalizeCode("12a456")).toBeNull();
    expect(normalizeCode(null)).toBeNull();
  });

  it("hash exactly as Auth.js does, so the wrong-code check finds the stored token", async () => {
    const secret = "test-secret";
    expect(hashCode("042317", secret)).toBe(await authJsHash(`042317${secret}`));
  });

  it("read well in an email", () => {
    expect(formatCode("042317")).toBe("042 317");
  });

  it("normalise emails as Auth.js stores them", () => {
    expect(normalizeEmail("  Riya@Example.COM ")).toBe("riya@example.com");
    expect(normalizeEmail(undefined)).toBe("");
  });
});
