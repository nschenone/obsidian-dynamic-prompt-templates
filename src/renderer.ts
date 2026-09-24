import { normalizePath, parseLinktext, TFile, type App } from "obsidian";
import type { DynamicPromptSettings, RenderResult, RenderWarning, RenderWarningType, TemplateInfo } from "./contracts";
import { getTemplateInfoByPath } from "./templates";
import { formatReferenceDate, parseReferenceDate } from "./utils/date";
import {
  extractFenceBody,
  extractHeadingSection,
  resolveDateTokens,
  splitMarkdownSegments,
  stripFrontmatter,
  warningCallout
} from "./utils/markdown";

interface IncludeCacheEntry {
  output: string;
}

interface RenderState {
  app: App;
  warnings: RenderWarning[];
  seenWarnings: Set<string>;
  includeCache: Map<string, Promise<IncludeCacheEntry>>;
  templatePath: string;
}

interface DataviewApiLike {
  tryQueryMarkdown?: (query: string, originFile?: string) => Promise<string>;
  queryMarkdown?: (query: string, originFile?: string) => Promise<{ successful: boolean; value?: string; error?: string }>;
}

function addWarning(state: RenderState, type: RenderWarningType, message: string): string {
  const key = `${type}:${message}`;
  if (!state.seenWarnings.has(key)) {
    state.seenWarnings.add(key);
    state.warnings.push({ type, message });
  }

  return warningCallout(message);
}

function getDataviewApi(app: App): DataviewApiLike | null {
  const plugin = (app as App & { plugins?: { plugins?: Record<string, { api?: DataviewApiLike }> } }).plugins?.plugins?.dataview;
  return plugin?.api ?? null;
}

async function renderDataviewBlock(state: RenderState, query: string): Promise<string> {
  const api = getDataviewApi(state.app);
  if (!api) {
    return addWarning(state, "missing-dataview", "Dataview rendering is unavailable because the Dataview plugin is missing or disabled.");
  }

  try {
    if (api.tryQueryMarkdown) {
      return (await api.tryQueryMarkdown(query, state.templatePath)).trim();
    }

    if (api.queryMarkdown) {
      const result = await api.queryMarkdown(query, state.templatePath);
      if (result.successful && typeof result.value === "string") {
        return result.value.trim();
      }

      return addWarning(state, "dataview-error", result.error ?? "Dataview query execution failed.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return addWarning(state, "dataview-error", `Dataview query execution failed: ${message}`);
  }

  return addWarning(state, "dataview-error", "Dataview is enabled but no compatible markdown query API was found.");
}

async function expandReference(state: RenderState, rawTarget: string): Promise<string> {
  const target = rawTarget.trim();
  const cacheKey = target;
  let cached = state.includeCache.get(cacheKey);
  if (!cached) {
    cached = resolveReference(state, target);
    state.includeCache.set(cacheKey, cached);
  }

  const result = await cached;
  return result.output;
}

async function resolveReference(state: RenderState, target: string): Promise<IncludeCacheEntry> {
  const [linkTarget] = target.split("|");
  const parsed = parseLinktext(linkTarget.trim());
  const rawPath = parsed.path.trim();
  const heading = parsed.subpath?.startsWith("#") ? parsed.subpath.slice(1) : parsed.subpath;
  const resolvedFile = state.app.metadataCache.getFirstLinkpathDest(rawPath, state.templatePath);

  if (!(resolvedFile instanceof TFile)) {
    return {
      output: addWarning(state, "missing-note", `Missing note: ${rawPath}`)
    };
  }

  const content = stripFrontmatter(await state.app.vault.cachedRead(resolvedFile));
  if (!heading) {
    return { output: content.trim() };
  }

  const section = extractHeadingSection(content, decodeURIComponent(heading));
  if (!section) {
    return {
      output: addWarning(state, "missing-heading", `Missing heading "${decodeURIComponent(heading)}" in ${resolvedFile.path}`)
    };
  }

  return { output: section.trim() };
}

async function renderTextSegment(state: RenderState, content: string): Promise<string> {
  const referencePattern = /!?\[\[([^\]]+)\]\]/g;
  let output = "";
  let lastIndex = 0;

  for (const match of content.matchAll(referencePattern)) {
    const [fullMatch, inner] = match;
    const start = match.index ?? 0;
    output += content.slice(lastIndex, start);
    output += await expandReference(state, inner);
    lastIndex = start + fullMatch.length;
  }

  output += content.slice(lastIndex);
  return output;
}

async function renderMarkdownContent(state: RenderState, content: string): Promise<string> {
  const segments = splitMarkdownSegments(content);
  const renderedSegments: string[] = [];

  for (const segment of segments) {
    if (segment.type === "text") {
      renderedSegments.push(await renderTextSegment(state, segment.content));
      continue;
    }

    const language = (segment.language ?? "").trim().toLowerCase();
    if (language === "dataview") {
      renderedSegments.push(await renderDataviewBlock(state, extractFenceBody(segment.content)));
      continue;
    }

    if (language === "dataviewjs") {
      renderedSegments.push(addWarning(state, "unsupported-dataviewjs", "Unsupported block: dataviewjs is not supported in v1."));
      continue;
    }

    renderedSegments.push(segment.content);
  }

  return renderedSegments.join("\n");
}

function normalizeRenderedMarkdown(markdown: string): string {
  return markdown.replace(/\t/g, "    ");
}

export async function renderTemplate(
  app: App,
  settings: DynamicPromptSettings,
  templatePath: string,
  referenceDate?: string
): Promise<RenderResult> {
  const normalizedPath = normalizePath(templatePath);
  const templateInfo = getTemplateInfoByPath(app, settings, normalizedPath);
  if (!templateInfo) {
    throw new Error(`Template not found: ${normalizedPath}`);
  }

  const abstractFile = app.vault.getAbstractFileByPath(normalizedPath);
  if (!(abstractFile instanceof TFile)) {
    throw new Error(`Template not found: ${normalizedPath}`);
  }

  const template = templateInfo satisfies TemplateInfo;
  const date = parseReferenceDate(referenceDate);
  const rawContent = await app.vault.cachedRead(abstractFile);
  const strippedTemplate = stripFrontmatter(rawContent);
  const resolvedDates = resolveDateTokens(strippedTemplate, date, settings.weekStart);
  const state: RenderState = {
    app,
    warnings: [],
    seenWarnings: new Set(),
    includeCache: new Map(),
    templatePath: normalizedPath
  };

  const markdown = normalizeRenderedMarkdown((await renderMarkdownContent(state, resolvedDates)).trim());
  return {
    template,
    referenceDate: formatReferenceDate(date),
    markdown,
    warnings: state.warnings
  };
}
