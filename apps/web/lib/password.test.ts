import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

// A dummy password: real admin passwords never appear in the repo.
const PASSWORD = "correct horse battery";

describe("admin password hashing", () => {
  it("accepts the right password and rejects others", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(hash).toMatch(/^scrypt:[\w-]+:[\w-]+$/);
    expect(hash).not.toContain(PASSWORD);
    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
    expect(await verifyPassword(`${PASSWORD} `, hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("salts every hash, so the same password never hashes the same way twice", async () => {
    expect(await hashPassword("x")).not.toBe(await hashPassword("x"));
  });

  it("refuses when no hash is configured or the hash is malformed", async () => {
    expect(await verifyPassword(PASSWORD, undefined)).toBe(false);
    expect(await verifyPassword(PASSWORD, "plain-text")).toBe(false);
    expect(await verifyPassword(PASSWORD, "scrypt$a$b")).toBe(false);
  });
});
