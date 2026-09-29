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

export interface PromptValues {
  referenceDate?: string;
  inputs: Record<string, PromptInputValue>;
}

/** Returns whether the prompted command needs a modal for this configuration. */
export function shouldPromptForInputs(promptRequested: boolean, configuration: PromptConfiguration): boolean {
  return promptRequested && (configuration.referenceDate || configuration.inputs.length > 0);
}

/** Coerces a changed control value back to the type of its configured default. */
export function coercePromptInputValue(field: PromptInputField, value: string | boolean): PromptInputValue {
  return field.kind === "number" ? Number(value) : value;
}

/** Produces the only runtime overrides a configured prompt may submit. */
export function createPromptValues(configuration: PromptConfiguration, referenceDate: string, values: Record<string, PromptInputValue>): PromptValues {
  return {
    referenceDate: configuration.referenceDate ? referenceDate : undefined,
    inputs: Object.fromEntries(configuration.inputs.map((field) => [field.key, values[field.key]]))
  };
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
