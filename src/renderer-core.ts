import { createEngine, standardFilters, type FilterRegistry } from "knap";
import type { RenderResult, RenderWarning, RenderWarningType, TemplateInfo } from "./contracts";
import { formatReferenceDate, parseReferenceDate } from "./utils/date";
import { lastDays, redactLines } from "./utils/filters";
import { extractFenceBody, splitMarkdownSegments, stripFrontmatter, warningCallout } from "./utils/markdown";

export interface FileLike { path: string; }
interface FileCache {
  frontmatter?: Record<string, unknown>;
  headings?: Array<{ heading: string; level: number; position: { start: { offset: number } } }>;
  blocks?: Record<string, { position: { start: { offset: number }; end: { offset: number } } }>;
}
export interface RenderHost {
  vault: { cachedRead(file: FileLike): Promise<string> };
  metadataCache: {
    getFirstLinkpathDest(path: string, sourcePath: string): FileLike | null;
    getFileCache(file: FileLike): FileCache | null;
  };
  plugins?: { plugins?: Record<string, { api?: DataviewApiLike }> };
}

interface RenderState {
  app: RenderHost;
  warnings: RenderWarning[];
  seenWarnings: Set<string>;
  transcludeCache: Map<string, Promise<string>>;
  templatePath: string;
  referenceDate: Date;
}
interface DataviewApiLike {
  tryQueryMarkdown?: (query: string, originFile?: string) => Promise<string>;
  queryMarkdown?: (query: string, originFile?: string) => Promise<{ successful: boolean; value?: string; error?: string }>;
}

function addWarning(state: RenderState, type: RenderWarningType, message: string): string {
  const key = `${type}:${message}`;
  if (!state.seenWarnings.has(key)) { state.seenWarnings.add(key); state.warnings.push({ type, message }); }
  return warningCallout(message);
}
function getDataviewApi(app: RenderHost): DataviewApiLike | null {
  return app.plugins?.plugins?.dataview?.api ?? null;
}
async function renderDataviewBlock(state: RenderState, query: string): Promise<string> {
  const api = getDataviewApi(state.app);
  if (!api) return addWarning(state, "missing-dataview", "Dataview rendering is unavailable because the Dataview plugin is missing or disabled.");
  try {
    if (api.tryQueryMarkdown) return (await api.tryQueryMarkdown(query, state.templatePath)).trim();
    if (api.queryMarkdown) {
      const result = await api.queryMarkdown(query, state.templatePath);
      if (result.successful && typeof result.value === "string") return result.value.trim();
      return addWarning(state, "dataview-error", result.error ?? "Dataview query execution failed.");
    }
  } catch (error) { return addWarning(state, "dataview-error", `Dataview query execution failed: ${error instanceof Error ? error.message : String(error)}`); }
  return addWarning(state, "dataview-error", "Dataview is enabled but no compatible markdown query API was found.");
}

async function transclude(state: RenderState, rawTarget: string): Promise<string> {
  const target = rawTarget.trim();
  if (!target) return addWarning(state, "missing-note", "Missing note: empty transclude target");
  let cached = state.transcludeCache.get(target);
  if (!cached) { cached = resolveTransclusion(state, target); state.transcludeCache.set(target, cached); }
  return cached;
}
function parseTranscludeTarget(link: string): { path: string; subpath: string } {
  const subpathIndex = link.search(/[#^]/);
  return subpathIndex === -1 ? { path: link, subpath: "" } : { path: link.slice(0, subpathIndex), subpath: link.slice(subpathIndex) };
}

async function resolveTransclusion(state: RenderState, target: string): Promise<string> {
  const [linkTarget] = target.split("|");
  const parsed = parseTranscludeTarget(linkTarget.trim());
  const file = state.app.metadataCache.getFirstLinkpathDest(parsed.path.trim(), state.templatePath);
  if (!file || typeof file.path !== "string") return addWarning(state, "missing-note", `Missing note: ${parsed.path.trim()}`);
  const source = await state.app.vault.cachedRead(file);
  const subpath = parsed.subpath;
  if (!subpath) return stripFrontmatter(source).trim();
  if (subpath.startsWith("#^")) {
    const blockId = subpath.slice(2);
    const block = (state.app.metadataCache.getFileCache(file)?.blocks ?? {})[blockId];
    if (!block) return addWarning(state, "missing-subpath", `Missing block "^${blockId}" in ${file.path}`);
    return source.slice(block.position.start.offset, block.position.end.offset).trim();
  }
  if (subpath.startsWith("#")) {
    const heading = decodeURIComponent(subpath.slice(1));
    const cache = state.app.metadataCache.getFileCache(file);
    const headings = cache?.headings ?? [];
    const targetHeading = headings.find((entry) => entry.heading.trim().toLocaleLowerCase() === heading.trim().toLocaleLowerCase());
    if (!targetHeading) return addWarning(state, "missing-subpath", `Missing heading "${heading}" in ${file.path}`);
    const start = targetHeading.position.start.offset;
    const next = headings.find((entry) => entry.position.start.offset > start && entry.level <= targetHeading.level);
    return source.slice(start, next?.position.start.offset).trim();
  }
  if (subpath.startsWith("^")) {
    const block = (state.app.metadataCache.getFileCache(file)?.blocks ?? {})[subpath.slice(1)];
    if (!block) return addWarning(state, "missing-subpath", `Missing block "${subpath}" in ${file.path}`);
    return source.slice(block.position.start.offset, block.position.end.offset).trim();
  }
  return addWarning(state, "missing-subpath", `Unsupported transclude subpath "${subpath}" in ${file.path}`);
}
function createRendererEngine(state: RenderState) {
  const filters: FilterRegistry = {
    ...standardFilters,
    last_days: (value) => lastDays(value, state.referenceDate),
    redact_lines: (value, prefix, context) => redactLines(value, context?.rawArguments?.[0] ?? prefix),
    transclude: async (value, subpath, context) => transclude(state, `${value}${String(context?.rawArguments?.[0] ?? subpath ?? "")}`)
  };
  return createEngine({ filters });
}
async function renderPostKnapMarkdown(state: RenderState, markdown: string): Promise<string> {
  const output: string[] = [];
  for (const segment of splitMarkdownSegments(markdown)) {
    if (segment.type === "text") output.push(segment.content);
    else if ((segment.language ?? "").trim().toLowerCase() === "dataview") output.push(await renderDataviewBlock(state, extractFenceBody(segment.content)));
    else if ((segment.language ?? "").trim().toLowerCase() === "dataviewjs") output.push(addWarning(state, "unsupported-dataviewjs", "Unsupported block: dataviewjs is not supported."));
    else output.push(segment.content);
  }
  return output.join("\n");
}
function templateDefaults(app: RenderHost, file: FileLike): Record<string, unknown> {
  const candidate = app.metadataCache.getFileCache(file)?.frontmatter?.dynamicPrompt;
  const inputs = candidate && typeof candidate === "object" ? (candidate as { inputs?: unknown }).inputs : undefined;
  return inputs && typeof inputs === "object" && !Array.isArray(inputs) ? { ...(inputs as Record<string, unknown>) } : {};
}

export async function renderTemplateContent(app: RenderHost, template: TemplateInfo, file: FileLike, referenceDate?: string, runtimeInputs: Record<string, unknown> = {}): Promise<RenderResult> {
  const date = parseReferenceDate(referenceDate);
  const state: RenderState = { app, warnings: [], seenWarnings: new Set(), transcludeCache: new Map(), templatePath: template.path, referenceDate: date };
  const source = stripFrontmatter(await app.vault.cachedRead(file));
  const result = await createRendererEngine(state).render(source, {
    variables: { referenceDate: formatReferenceDate(date), template, inputs: { ...templateDefaults(app, file), ...runtimeInputs } }
  });
  for (const diagnostic of result.errors) addWarning(state, "template", `Template ${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`);
  for (const diagnostic of result.warnings) addWarning(state, "template", `Template ${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`);
  const rendered = result.errors.length ? "" : await renderPostKnapMarkdown(state, result.output);
  return { template, referenceDate: formatReferenceDate(date), markdown: rendered.replace(/\t/g, "    ").trim(), warnings: state.warnings };
}
