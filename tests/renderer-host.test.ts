import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderTemplateContent } from "../src/renderer-core";

interface MockFile { path: string; }
const settings = { templateFolder: "Templates", showPreviewAfterRender: true, autoCopyToClipboard: false, enableLocalApi: false, apiHost: "127.0.0.1", apiPort: 27131, apiAuthToken: "" };
function host(entries: Record<string, { source: string; frontmatter?: Record<string, unknown>; headings?: Array<{ heading: string; level: number; position: { start: { offset: number } } }>; blocks?: Record<string, { position: { start: { offset: number }; end: { offset: number } } }> }>, dataview?: { tryQueryMarkdown: ReturnType<typeof vi.fn> }) {
  const files = Object.fromEntries(Object.keys(entries).map((path) => [path, { path }])) as Record<string, MockFile>;
  const cachedRead = vi.fn(async (target: MockFile) => entries[target.path]!.source);
  return {
    vault: { cachedRead },
    metadataCache: {
      getFirstLinkpathDest: vi.fn((path: string) => files[`Templates/${path}`] ?? files[path] ?? null),
      getFileCache: (target: MockFile) => ({ frontmatter: entries[target.path]!.frontmatter, headings: entries[target.path]!.headings, blocks: entries[target.path]!.blocks })
    },
    plugins: dataview ? { plugins: { dataview: { api: dataview } } } : undefined,
    root: files["Templates/Root.md"]!
  };
}
async function render(app: ReturnType<typeof host>, inputs: Record<string, unknown> = {}) {
  return renderTemplateContent(app, { id: "Templates/Root.md", path: "Templates/Root.md", title: "Root" }, app.root, "2026-07-07", inputs);
}

describe("shared renderer with an Obsidian host", () => {
  beforeEach(() => vi.clearAllMocks());

  it("strips CRLF root frontmatter and shallow-merges defaults with runtime inputs", async () => {
    const app = host({ "Templates/Root.md": { source: "---\r\ndynamicPrompt:\r\n---\r\n{{ template.title }} {{ referenceDate }} {{ inputs.audience }} {{ inputs.nested.value }}", frontmatter: { dynamicPrompt: { inputs: { audience: "default", nested: { value: "default" } } } } } });
    const result = await render(app, { audience: "runtime", nested: { value: "runtime" } });
    expect(result.markdown).toBe("Root 2026-07-07 runtime runtime");
    expect(result.markdown).not.toContain("dynamicPrompt");
  });

  it("transcludes source-relative headings and blocks without frontmatter and caches each target", async () => {
    const child = "---\r\ntitle: Child\r\n---\r\n## Target\r\nHeading body\r\n## Later\r\nLater body\r\nBlock body";
    const targetStart = child.indexOf("## Target");
    const laterStart = child.indexOf("## Later");
    const blockStart = child.indexOf("Block body");
    const app = host({
      "Templates/Root.md": { source: '{{ "Child.md#Target" | transclude }}\n{{ "Child.md#Target" | transclude }}\n{{ "Child.md#^block" | transclude }}\n{{ "Child.md" | transclude }}' },
      "Templates/Child.md": { source: child, headings: [
        { heading: "Target", level: 2, position: { start: { offset: targetStart } } },
        { heading: "Later", level: 2, position: { start: { offset: laterStart } } }
      ], blocks: { block: { position: { start: { offset: blockStart }, end: { offset: blockStart + "Block body".length } } } } }
    });
    const result = await render(app);
    expect(result.markdown).toContain("## Target\r\nHeading body");
    expect(result.markdown).toContain("Block body");
    expect(result.markdown).not.toContain("title: Child");
    expect(app.vault.cachedRead.mock.calls.filter(([target]) => target.path === "Templates/Child.md")).toHaveLength(3);
  });

  it("applies a transclude subpath passed as a filter argument", async () => {
    const child = "## Target\nHeading body\n## Later\nLater body";
    const targetStart = child.indexOf("## Target");
    const laterStart = child.indexOf("## Later");
    const app = host({
      "Templates/Root.md": { source: '{{ "Child.md" | transclude:"#Target" }}' },
      "Templates/Child.md": { source: child, headings: [
        { heading: "Target", level: 2, position: { start: { offset: targetStart } } },
        { heading: "Later", level: 2, position: { start: { offset: laterStart } } }
      ] }
    });
    const result = await render(app);
    expect(result.markdown).toBe("## Target\nHeading body");
  });

  it("returns useful missing target and subpath diagnostics", async () => {
    const app = host({ "Templates/Root.md": { source: '{{ "Missing.md" | transclude }}\n{{ "Child.md#Absent" | transclude }}\n{{ "Child.md#^absent" | transclude }}' }, "Templates/Child.md": { source: "# Present" } });
    const result = await render(app);
    expect(result.warnings.map((warning) => warning.message)).toEqual(expect.arrayContaining(["Missing note: Missing.md", 'Missing heading "Absent" in Templates/Child.md', 'Missing block "^absent" in Templates/Child.md']));
  });

  it("runs native Dataview after Knap and leaves ordinary wikilinks intact", async () => {
    const tryQueryMarkdown = vi.fn(async (query: string) => `result for ${query}`);
    const app = host({ "Templates/Root.md": { source: "[[Ordinary]]\n```dataview\nLIST {{ inputs.tag }}\n```" } }, { tryQueryMarkdown });
    const result = await render(app, { tag: "#work" });
    expect(tryQueryMarkdown).toHaveBeenCalledWith("LIST #work", "Templates/Root.md");
    expect(result.markdown).toBe("[[Ordinary]]\nresult for LIST #work");
  });
});
