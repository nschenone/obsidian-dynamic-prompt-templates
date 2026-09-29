export type PromptInputValue = string | number | boolean;
export type PromptInputKind = "text" | "number" | "boolean";

export interface PromptInputField {
  key: string;
  value: PromptInputValue;
  kind: PromptInputKind;
}

export interface PromptConfiguration {
  referenceDate: boolean;
  inputs: PromptInputField[];
  diagnostics: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function promptInputKind(value: unknown): PromptInputKind | null {
  if (typeof value === "string") return "text";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number" && Number.isFinite(value)) return "number";
  return null;
}

/** Parses the opt-in modal configuration from template frontmatter. */
export function parsePromptConfiguration(frontmatter: unknown): PromptConfiguration {
  const configuration: PromptConfiguration = { referenceDate: false, inputs: [], diagnostics: [] };
  if (!isRecord(frontmatter) || !isRecord(frontmatter.dynamicPrompt)) return configuration;

  const dynamicPrompt = frontmatter.dynamicPrompt;
  const prompt = dynamicPrompt.prompt;
  if (prompt === undefined) return configuration;
  if (!isRecord(prompt)) {
    configuration.diagnostics.push("dynamicPrompt.prompt must be an object.");
    return configuration;
  }

  if (prompt.referenceDate !== undefined) {
    if (typeof prompt.referenceDate !== "boolean") {
      configuration.diagnostics.push("dynamicPrompt.prompt.referenceDate must be a boolean.");
    } else {
      configuration.referenceDate = prompt.referenceDate;
    }
  }

  if (prompt.inputs === undefined) return configuration;
  if (!Array.isArray(prompt.inputs)) {
    configuration.diagnostics.push("dynamicPrompt.prompt.inputs must be an ordered list of input names.");
    return configuration;
  }

  const defaults = isRecord(dynamicPrompt.inputs) ? dynamicPrompt.inputs : null;
  if (!defaults) {
    configuration.diagnostics.push("dynamicPrompt.inputs must be an object when prompt inputs are configured.");
    return configuration;
  }

  const seen = new Set<string>();
  for (const key of prompt.inputs) {
    if (typeof key !== "string" || !key.trim()) {
      configuration.diagnostics.push("dynamicPrompt.prompt.inputs entries must be non-empty strings.");
      continue;
    }
    if (seen.has(key)) {
      configuration.diagnostics.push(`dynamicPrompt.prompt.inputs contains duplicate input "${key}".`);
      continue;
    }
    seen.add(key);
    const kind = promptInputKind(defaults[key]);
    if (!kind) {
      configuration.diagnostics.push(`Prompt input "${key}" must have a primitive string, finite number, or boolean default.`);
      continue;
    }
    configuration.inputs.push({ key, value: defaults[key] as PromptInputValue, kind });
  }

  return configuration;
}
