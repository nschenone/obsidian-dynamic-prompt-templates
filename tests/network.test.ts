import { describe, expect, it } from "vitest";
import { hasValidBearerToken, isLoopbackHost } from "../src/utils/network";

describe("network utils", () => {
  it("recognizes loopback hosts", () => {
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(isLoopbackHost("10.0.0.4")).toBe(false);
  });

  it("allows unauthenticated requests when no token is configured", () => {
    expect(hasValidBearerToken("", undefined)).toBe(true);
  });

  it("validates bearer auth when a token is configured", () => {
    expect(hasValidBearerToken("secret", "Bearer secret")).toBe(true);
    expect(hasValidBearerToken("secret", "Bearer nope")).toBe(false);
    expect(hasValidBearerToken("secret", undefined)).toBe(false);
  });
});
