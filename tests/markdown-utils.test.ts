import { describe, expect, it } from "vitest";
import { extractHeadingSection, resolveDateTokens, splitMarkdownSegments, stripFrontmatter } from "../src/utils/markdown";

describe("markdown utils", () => {
  it("strips frontmatter from the template body", () => {
    const input = `---\ntitle: Weekly Reflection\n---\n# Heading\nBody`;
    expect(stripFrontmatter(input)).toBe("# Heading\nBody");
  });

  it("resolves date tokens against the reference date", () => {
    const output = resolveDateTokens("Week {{gggg-[W]ww}}", new Date(2026, 6, 7));
    expect(output).toBe("Week 2026-W28");
  });

  it("preserves the default sunday-based week resolution", () => {
    const output = resolveDateTokens("Week {{gggg-[W]ww}}", new Date(2026, 6, 12));
    expect(output).toBe("Week 2026-W29");
  });

  it("supports monday-based week resolution", () => {
    const output = resolveDateTokens("Week {{gggg-[W]ww}}", new Date(2026, 6, 12), "monday");
    expect(output).toBe("Week 2026-W28");
  });

  it("extracts a heading section through descendant headings", () => {
    const section = extractHeadingSection(
      "# Top\n\n## Wins\nDid A\n\n### Details\nDid B\n\n## Lessons\nDid C",
      "Wins"
    );
    expect(section).toBe("## Wins\nDid A\n\n### Details\nDid B");
  });

  it("splits fenced code blocks away from text", () => {
    const segments = splitMarkdownSegments("Hello\n```dataview\nLIST FROM #x\n```\nWorld");
    expect(segments).toHaveLength(3);
    expect(segments[1]).toMatchObject({ type: "code", language: "dataview" });
  });
});
