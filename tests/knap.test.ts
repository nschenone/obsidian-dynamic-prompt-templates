import { createEngine, standardFilters } from "knap";
import { describe, expect, it } from "vitest";
import { lastDays, redactLines } from "../src/utils/filters";

describe("Knap template engine", () => {
  it("renders host data, generic inputs, loops, and custom filters", async () => {
    const engine = createEngine({
      filters: {
        ...standardFilters,
        last_days: (value) => lastDays(value, new Date(2026, 6, 7)),
        redact_lines: (value, prefix, context) => redactLines(value, context?.rawArguments?.[0] ?? prefix)
      }
    });
    const result = await engine.render(
      "{{ template.title }} {{ referenceDate }} {{ inputs.audience | upper }}\n{% for day in 3 | last_days %}{{ day }} {% endfor %}\n{{ inputs.notes | redact_lines: 'secret:' }}",
      { variables: { referenceDate: "2026-07-07", template: { title: "Weekly" }, inputs: { audience: "team", notes: "safe\nSECRET: token" } } }
    );
    expect(result.errors).toEqual([]);
    expect(result.output).toContain("Weekly 2026-07-07 TEAM");
    expect(result.output).toMatch(/2026-07-05\s+2026-07-06\s+2026-07-07/);
    expect(result.output).toContain("safe");
    expect(result.output).not.toContain("token");
  });
  it("returns location-bearing diagnostics for invalid Knap templates", async () => {
    const result = await createEngine({ filters: standardFilters }).render("{{ value | absent }}", { variables: { value: "x" } });
    expect(result.errors[0]).toMatchObject({ code: "UNKNOWN_FILTER", line: 1 });
    expect(result.errors[0]?.column).toBeGreaterThan(0);
  });
});
