import { describe, expect, it } from "vitest";
import { lastDays, MAX_DAYS, redactLines } from "../src/utils/filters";

describe("shared Knap filters", () => {
  it("returns inclusive ISO calendar dates ending at the reference date", () => {
    expect(lastDays(3, new Date(2026, 6, 7))).toEqual(["2026-07-05", "2026-07-06", "2026-07-07"]);
  });
  it("rejects non-positive, fractional, and excessive day counts", () => {
    for (const value of [0, -1, 1.5, MAX_DAYS + 1]) expect(() => lastDays(value, new Date())).toThrow("positive integer");
  });
  it("redacts complete matching lines case-insensitively", () => {
    expect(redactLines("ok\n Secret: token\nSECRET: second\nkeep", "secret:")).toBe("ok\nkeep");
  });
  it("fails closed when redaction input or prefix is invalid", () => {
    expect(redactLines("SECRET: token", "")).toBe("");
    expect(redactLines({ secret: "token" }, "secret:")).toBe("");
  });
});
