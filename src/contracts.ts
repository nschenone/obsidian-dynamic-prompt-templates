export type WeekStartMode = "sunday" | "monday";

export interface DynamicPromptSettings {
  templateFolder: string;
  showPreviewAfterRender: boolean;
  autoCopyToClipboard: boolean;
  weekStart: WeekStartMode;
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
  | "missing-heading"
  | "missing-dataview"
  | "unsupported-dataviewjs"
  | "dataview-error";

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

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
}

export interface RenderRequestBody {
  templatePath: string;
  referenceDate?: string;
}
