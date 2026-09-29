export interface DynamicPromptSettings {
  templateFolder: string;
  showPreviewAfterRender: boolean;
  autoCopyToClipboard: boolean;
  enableLocalApi: boolean;
  apiHost: string;
  apiPort: number;
  apiAuthToken: string;
}

export interface TemplateInfo {
  id: string;
  path: string;
  title: string;
  description?: string;
}

export type RenderWarningType =
  | "missing-note"
  | "missing-subpath"
  | "missing-dataview"
  | "unsupported-dataviewjs"
  | "dataview-error"
  | "template";

export interface RenderWarning {
  type: RenderWarningType;
  message: string;
}

export interface RenderResult {
  template: TemplateInfo;
  referenceDate: string;
  markdown: string;
  warnings: RenderWarning[];
}

export interface ApiSuccess<T> { success: true; data: T; }
export interface ApiFailure { success: false; error: string; }

export interface RenderRequestBody {
  templatePath: string;
  referenceDate?: string;
  inputs?: Record<string, unknown>;
}
