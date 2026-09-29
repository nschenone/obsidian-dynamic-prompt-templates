import { shouldPromptForInputs, type PromptConfiguration, type PromptValues } from "./prompt-config";

/** Runs the modal-or-render portion of a selected template render flow. */
export async function renderWithOptionalPrompt<T>(
  templatePath: string,
  promptForInputs: boolean,
  configuration: PromptConfiguration,
  chooseInputs: () => Promise<PromptValues | null>,
  renderTemplateByPath: (templatePath: string, referenceDate?: string, inputs?: Record<string, unknown>) => Promise<T>
): Promise<T | null> {
  if (!shouldPromptForInputs(promptForInputs, configuration)) {
    return renderTemplateByPath(templatePath, undefined, undefined);
  }

  const prompted = await chooseInputs();
  if (!prompted) return null;
  return renderTemplateByPath(templatePath, prompted.referenceDate, prompted.inputs);
}
