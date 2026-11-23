import { describe, it, expect, beforeEach } from "vitest";

// Set required env vars before importing auth
beforeEach(() => {
  process.env.ADMIN_PASSWORD = "test-password-123";
  process.env.CMS_SESSION_SECRET = "test-secret-that-is-long-enough-here";
});

describe("passwordsMatch", () => {
  it("returns true for the correct password", async () => {
    const { passwordsMatch } = await import("../auth");
    expect(passwordsMatch("test-password-123")).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const { passwordsMatch } = await import("../auth");
    expect(passwordsMatch("wrong-password")).toBe(false);
  });

  it("returns false for empty string", async () => {
    const { passwordsMatch } = await import("../auth");
    expect(passwordsMatch("")).toBe(false);
  });
});

describe("createSessionToken", () => {
  it("returns a hex string", async () => {
    const { createSessionToken } = await import("../auth");
    const token = createSessionToken();
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it("returns the same value when called twice (deterministic)", async () => {
    const { createSessionToken } = await import("../auth");
    expect(createSessionToken()).toBe(createSessionToken());
  });
});