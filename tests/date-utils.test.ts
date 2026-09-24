import { describe, expect, it } from "vitest";
import { formatReferenceDate, parseReferenceDate } from "../src/utils/date";

describe("reference date utils", () => {
  it("preserves a date-only reference in local calendar time", () => {
    const parsed = parseReferenceDate("2026-09-20");

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8);
    expect(parsed.getDate()).toBe(20);
    expect(formatReferenceDate(parsed)).toBe("2026-09-20");
  });

  it("rejects an impossible date-only reference", () => {
    expect(() => parseReferenceDate("2026-02-30")).toThrow("Invalid reference date: 2026-02-30");
  });
});
