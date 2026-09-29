import { describe, expect, it } from "vitest";
import { splitMarkdownSegments, stripFrontmatter } from "../src/utils/markdown";

describe("markdown utils", () => {
  it("strips frontmatter from the template body", () => {
    expect(stripFrontmatter("---\ntitle: Weekly\n---\n# Heading\nBody")).toBe("# Heading\nBody");
  });
  it("strips CRLF frontmatter without changing the CRLF body", () => {
    expect(stripFrontmatter("---\r\ntitle: Weekly\r\n---\r\n# Heading\r\nBody")).toBe("# Heading\r\nBody");
  });
  it("splits fenced code blocks away from text", () => {
    const segments = splitMarkdownSegments("Hello\n```dataview\nLIST FROM #x\n```\nWorld");
    expect(segments).toHaveLength(3);
    expect(segments[1]).toMatchObject({ type: "code", language: "dataview" });
  });
});
