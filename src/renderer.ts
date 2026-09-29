import { normalizePath, TFile, type App } from "obsidian";
import type { DynamicPromptSettings, RenderResult } from "./contracts";
import { renderTemplateContent } from "./renderer-core";
import { getTemplateInfoByPath } from "./templates";

export { renderTemplateContent } from "./renderer-core";

export async function renderTemplate(app: App, settings: DynamicPromptSettings, templatePath: string, referenceDate?: string, runtimeInputs: Record<string, unknown> = {}): Promise<RenderResult> {
  const normalizedPath = normalizePath(templatePath);
  const template = getTemplateInfoByPath(app, settings, normalizedPath);
  const file = app.vault.getAbstractFileByPath(normalizedPath);
  if (!template || !(file instanceof TFile)) throw new Error(`Template not found: ${normalizedPath}`);
  return renderTemplateContent(app, template, file, referenceDate, runtimeInputs);
}
