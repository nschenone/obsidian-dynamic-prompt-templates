import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import type { DynamicPromptSettings, RenderResult } from "./contracts";
import { chooseReferenceDate, chooseTemplate, PreviewModal } from "./modals";
import { renderTemplate } from "./renderer";
import { DEFAULT_SETTINGS } from "./settings";
import { getTemplateInfos } from "./templates";
import { copyTextToClipboard } from "./utils/clipboard";
import { isLoopbackHost } from "./utils/network";
import { LocalApiServer } from "./api-server";

type DynamicPromptTemplatesApi = {
  version: 1;
  renderTemplateByPath: (templatePath: string, referenceDate?: string) => Promise<RenderResult>;
};

declare global {
  interface Window {
    dynamicPromptTemplatesApi?: DynamicPromptTemplatesApi;
  }
}

export default class DynamicPromptTemplatesPlugin extends Plugin {
  settings!: DynamicPromptSettings;
  private apiServer: LocalApiServer | null = null;
  private readonly integrationApi: DynamicPromptTemplatesApi = {
    version: 1,
    renderTemplateByPath: (templatePath, referenceDate) => this.renderTemplateByPath(templatePath, referenceDate)
  };

  async onload(): Promise<void> {
    await this.loadSettings();
    window.dynamicPromptTemplatesApi = this.integrationApi;
    this.apiServer = new LocalApiServer(this);
    this.addSettingTab(new DynamicPromptSettingsTab(this.app, this));

    this.addCommand({
      id: "render-dynamic-prompt-template",
      name: "Render dynamic prompt template",
      callback: async () => {
        await this.runRenderFlow(false);
      }
    });

    this.addCommand({
      id: "render-dynamic-prompt-template-with-date",
      name: "Render dynamic prompt template with date",
      callback: async () => {
        await this.runRenderFlow(true);
      }
    });

    await this.syncApiServer();
  }

  async onunload(): Promise<void> {
    if (window.dynamicPromptTemplatesApi === this.integrationApi) delete window.dynamicPromptTemplatesApi;
    await this.apiServer?.stop();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    await this.syncApiServer();
  }

  async listTemplates() {
    return getTemplateInfos(this.app, this.settings);
  }

  async renderTemplateByPath(templatePath: string, referenceDate?: string): Promise<RenderResult> {
    return renderTemplate(this.app, this.settings, templatePath, referenceDate);
  }

  private async runRenderFlow(promptForDate: boolean): Promise<void> {
    const templates = await this.listTemplates();
    if (templates.length === 0) {
      new Notice(`No templates found in ${this.settings.templateFolder}`);
      return;
    }

    const template = await chooseTemplate(this.app, templates);
    if (!template) {
      return;
    }

    const referenceDate = promptForDate ? await chooseReferenceDate(this.app, new Date().toISOString().slice(0, 10)) : undefined;
    if (promptForDate && !referenceDate) {
      return;
    }

    try {
      const result = await this.renderTemplateByPath(template.path, referenceDate ?? undefined);
      await this.handleRenderResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Render failed: ${message}`);
    }
  }

  private async handleRenderResult(result: RenderResult): Promise<void> {
    if (this.settings.showPreviewAfterRender) {
      new PreviewModal(this.app, result).open();
    }

    if (this.settings.autoCopyToClipboard) {
      void copyTextToClipboard(result.markdown).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        new Notice(`Rendered prompt, but clipboard copy failed: ${message}`);
      });
    }

    if (this.settings.showPreviewAfterRender) {
      return;
    }

    const summary = result.warnings.length > 0 ? ` with ${result.warnings.length} warning(s)` : "";
    new Notice(`Rendered ${result.template.title}${summary}.`);
  }

  private async syncApiServer(): Promise<void> {
    if (!this.apiServer) {
      return;
    }

    if (!this.settings.enableLocalApi) {
      await this.apiServer.stop();
      return;
    }

    try {
      await this.apiServer.restart();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to start local API: ${message}`);
    }
  }
}

class DynamicPromptSettingsTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: DynamicPromptTemplatesPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Template folder")
      .setDesc("Every markdown file in this folder is treated as a prompt template.")
      .addText((text) =>
        text.setValue(this.plugin.settings.templateFolder).onChange(async (value) => {
          this.plugin.settings.templateFolder = value.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Show preview after render")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showPreviewAfterRender).onChange(async (value) => {
          this.plugin.settings.showPreviewAfterRender = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Auto-copy rendered prompt")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoCopyToClipboard).onChange(async (value) => {
          this.plugin.settings.autoCopyToClipboard = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Week start")
      .setDesc("Controls how week-based date tokens like {{gggg-[W]ww}} are resolved during rendering.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("sunday", "Sunday")
          .addOption("monday", "Monday")
          .setValue(this.plugin.settings.weekStart)
          .onChange(async (value) => {
            this.plugin.settings.weekStart = value === "monday" ? "monday" : "sunday";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Enable local API")
      .setDesc("Desktop only. Exposes template listing and rendering over HTTP.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableLocalApi).onChange(async (value) => {
          this.plugin.settings.enableLocalApi = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("API host")
      .setDesc("Defaults to 127.0.0.1. Change only if you need a different bind target.")
      .addText((text) =>
        text.setValue(this.plugin.settings.apiHost).onChange(async (value) => {
          this.plugin.settings.apiHost = value.trim();
          await this.plugin.saveSettings();
          this.display();
        })
      );

    new Setting(containerEl)
      .setName("API port")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.apiPort)).onChange(async (value) => {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            this.plugin.settings.apiPort = parsed;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("API auth token")
      .setDesc("Optional bearer token. Leave empty to allow unauthenticated local requests.")
      .addText((text) =>
        text.setPlaceholder("Bearer token").setValue(this.plugin.settings.apiAuthToken).onChange(async (value) => {
          this.plugin.settings.apiAuthToken = value.trim();
          await this.plugin.saveSettings();
        })
      );

    if (!isLoopbackHost(this.plugin.settings.apiHost)) {
      containerEl.createDiv({
        cls: "dynamic-prompt-settings__warning",
        text: "Warning: this host is not loopback-only. Make sure your reverse proxy and network boundary are configured the way you expect."
      });
    }
  }
}
