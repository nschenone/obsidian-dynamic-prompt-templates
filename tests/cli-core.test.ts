import { describe, expect, it, vi } from "vitest";
import { formatRenderOutput, formatTemplateList, parseCliArgs, runCli } from "../src/cli/core";
import type { RenderResult, TemplateInfo } from "../src/contracts";

describe("cli core", () => {
  it("parses render options", () => {
    const parsed = parseCliArgs(["render", "Templates/Prompts/Weekly.md", "--reference-date", "2026-07-07", "--json"]);
    expect(parsed.command).toBe("render");
    expect(parsed.templatePath).toBe("Templates/Prompts/Weekly.md");
    expect(parsed.referenceDate).toBe("2026-07-07");
    expect(parsed.json).toBe(true);
  });

  it("formats template lists with path-based ids", () => {
    const templates: TemplateInfo[] = [{ id: "A.md", path: "A.md", title: "Alpha" }];
    expect(formatTemplateList(templates)).toBe("A.md\tAlpha");
  });

  it("formats markdown-first render output by default", () => {
    const result: RenderResult = {
      template: { id: "A.md", path: "A.md", title: "Alpha" },
      referenceDate: "2026-07-07",
      markdown: "# Prompt",
      warnings: []
    };
    expect(formatRenderOutput(result, false)).toBe("# Prompt");
    expect(formatRenderOutput(result, true)).toContain('"success": true');
  });

  it("returns non-zero for render without a template path", async () => {
    const stdout = vi.fn();
    const stderr = vi.fn();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: { templates: [{ id: "A.md", path: "A.md", title: "Alpha" }] } })
    })) as unknown as typeof fetch;

    const exitCode = await runCli(["render"], { stdout, stderr }, fetchImpl);
    expect(exitCode).toBe(1);
    expect(stderr).toHaveBeenCalled();
  });
});
