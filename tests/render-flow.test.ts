import { describe, expect, it, vi } from "vitest";
import { parsePromptConfiguration } from "../src/prompt-config";
import { renderWithOptionalPrompt } from "../src/render-flow";

const templatePath = "Templates/Prompt.md";

describe("runRenderFlow modal-ineligible paths", () => {
  it("renders the fast command directly without prompted overrides", async () => {
    const chooseInputs = vi.fn();
    const renderTemplateByPath = vi.fn().mockResolvedValue("rendered");
    const configuration = parsePromptConfiguration({
      dynamicPrompt: { inputs: { days: 1 }, prompt: { referenceDate: true, inputs: ["days"] } }
    });

    await renderWithOptionalPrompt(templatePath, false, configuration, chooseInputs, renderTemplateByPath);

    expect(chooseInputs).not.toHaveBeenCalled();
    expect(renderTemplateByPath).toHaveBeenCalledWith(templatePath, undefined, undefined);
  });

  it("renders directly when prompted configuration has no valid fields", async () => {
    const chooseInputs = vi.fn();
    const renderTemplateByPath = vi.fn().mockResolvedValue("rendered");
    const configuration = parsePromptConfiguration({
      dynamicPrompt: { inputs: { nested: {} }, prompt: { inputs: ["nested"] } }
    });

    await renderWithOptionalPrompt(templatePath, true, configuration, chooseInputs, renderTemplateByPath);

    expect(chooseInputs).not.toHaveBeenCalled();
    expect(renderTemplateByPath).toHaveBeenCalledWith(templatePath, undefined, undefined);
  });
});
