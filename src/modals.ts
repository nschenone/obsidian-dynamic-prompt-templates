import { App, ButtonComponent, Modal, Setting, SuggestModal } from "obsidian";
import type { RenderResult, TemplateInfo } from "./contracts";
import { copyTextToClipboard } from "./utils/clipboard";

class TemplateSelectModal extends SuggestModal<TemplateInfo> {
  private readonly resolver: (value: TemplateInfo | null) => void;
  private settled = false;
  private selectedTemplate: TemplateInfo | null = null;

  constructor(app: App, private readonly templates: TemplateInfo[], resolver: (value: TemplateInfo | null) => void) {
    super(app);
    this.resolver = resolver;
    this.setPlaceholder("Select a dynamic prompt template");
  }

  onClose(): void {
    super.onClose();
    if (!this.settled) {
      window.setTimeout(() => {
        if (!this.settled) {
          this.finish(this.selectedTemplate);
        }
      }, 0);
    }
  }

  getSuggestions(query: string): TemplateInfo[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.templates;
    }

    return this.templates.filter((template) => {
      const haystack = `${template.title} ${template.path} ${template.description ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }

  renderSuggestion(template: TemplateInfo, el: HTMLElement): void {
    el.createDiv({ text: template.title });
    el.createDiv({ text: template.path, cls: "mod-muted" });
    if (template.description) {
      el.createDiv({ text: template.description, cls: "mod-muted" });
    }
  }

  onChooseSuggestion(template: TemplateInfo): void {
    this.selectedTemplate = template;
    this.finish(template);
  }

  private finish(value: TemplateInfo | null): void {
    if (this.settled) {
      return;
    }

    this.settled = true;
    this.resolver(value);
  }
}

export function chooseTemplate(app: App, templates: TemplateInfo[]): Promise<TemplateInfo | null> {
  return new Promise((resolve) => {
    const modal = new TemplateSelectModal(app, templates, resolve);
    modal.open();
  });
}

export class ReferenceDateModal extends Modal {
  private value: string;
  private readonly resolver: (value: string | null) => void;
  private settled = false;

  constructor(app: App, initialValue: string, resolver: (value: string | null) => void) {
    super(app);
    this.value = initialValue;
    this.resolver = resolver;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Reference Date" });
    new Setting(contentEl)
      .setName("Render reference date")
      .addText((text) => {
        text.setPlaceholder("YYYY-MM-DD").setValue(this.value);
        text.inputEl.type = "date";
        text.onChange((value) => {
          this.value = value;
        });
      });

    const buttonRow = contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(buttonRow).setButtonText("Cancel").onClick(() => this.finish(null));
    new ButtonComponent(buttonRow).setButtonText("Render").setCta().onClick(() => this.finish(this.value));
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.settled) {
      this.finish(null);
    }
  }

  private finish(value: string | null): void {
    if (this.settled) {
      return;
    }

    this.settled = true;
    this.resolver(value);
    this.close();
  }
}

export function chooseReferenceDate(app: App, initialValue: string): Promise<string | null> {
  return new Promise((resolve) => {
    const modal = new ReferenceDateModal(app, initialValue, resolve);
    modal.open();
  });
}

export class PreviewModal extends Modal {
  constructor(app: App, private readonly result: RenderResult) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.result.template.title });
    contentEl.createEl("p", { text: `Reference date: ${this.result.referenceDate}` });

    if (this.result.warnings.length > 0) {
      const warningsEl = contentEl.createDiv({ cls: "dynamic-prompt-preview__warnings" });
      warningsEl.createEl("h3", { text: "Warnings" });
      for (const warning of this.result.warnings) {
        warningsEl.createDiv({ text: warning.message, cls: "dynamic-prompt-preview__warning" });
      }
    }

    const output = contentEl.createEl("textarea", { cls: "dynamic-prompt-preview__output" });
    output.value = this.result.markdown;

    const buttonRow = contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(buttonRow)
      .setButtonText("Copy again")
      .setCta()
      .onClick(async () => {
        await copyTextToClipboard(this.result.markdown);
      });
    new ButtonComponent(buttonRow).setButtonText("Close").onClick(() => this.close());
  }
}
