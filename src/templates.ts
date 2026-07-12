import { normalizePath, TFile, type App } from "obsidian";
import type { DynamicPromptSettings, TemplateInfo } from "./contracts";

function getDisplayTitle(app: App, file: TFile): string {
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  const title = frontmatter?.title;
  return typeof title === "string" && title.trim().length > 0 ? title.trim() : file.basename;
}

function getDescription(app: App, file: TFile): string | undefined {
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  const description = frontmatter?.description;
  if (typeof description === "string" && description.trim().length > 0) {
    return description.trim();
  }

  return undefined;
}

export function getTemplateFiles(app: App, settings: DynamicPromptSettings): TFile[] {
  const folder = normalizePath(settings.templateFolder).replace(/\/$/, "");
  return app.vault
    .getMarkdownFiles()
    .filter((file) => file.path.startsWith(`${folder}/`) || file.path === folder);
}

export function getTemplateInfos(app: App, settings: DynamicPromptSettings): TemplateInfo[] {
  return getTemplateFiles(app, settings)
    .map((file) => ({
      id: file.path,
      path: file.path,
      title: getDisplayTitle(app, file),
      description: getDescription(app, file)
    }))
    .sort((left, right) => left.title.localeCompare(right.title) || left.path.localeCompare(right.path));
}

export function getTemplateInfoByPath(app: App, settings: DynamicPromptSettings, templatePath: string): TemplateInfo | null {
  return getTemplateInfos(app, settings).find((template) => template.path === normalizePath(templatePath)) ?? null;
}
