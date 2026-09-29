import type { DynamicPromptSettings } from "./contracts";

export const DEFAULT_SETTINGS: DynamicPromptSettings = {
  templateFolder: "Templates/Prompts",
  showPreviewAfterRender: true,
  autoCopyToClipboard: true,
  enableLocalApi: false,
  apiHost: "127.0.0.1",
  apiPort: 27131,
  apiAuthToken: ""
};
