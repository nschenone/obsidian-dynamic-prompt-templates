import { describe, expect, it } from "vitest";
import { parsePromptConfiguration } from "../src/prompt-config";

describe("prompt configuration", () => {
  it("preserves the configured input order, defaults, and primitive types", () => {
    const configuration = parsePromptConfiguration({
      dynamicPrompt: {
        inputs: { days: 7, audience: "team", includeTasks: true, hidden: "not prompted" },
        prompt: { referenceDate: true, inputs: ["audience", "days", "includeTasks"] }
      }
    });

    expect(configuration).toMatchObject({
      referenceDate: true,
      inputs: [
        { key: "audience", value: "team", kind: "text" },
        { key: "days", value: 7, kind: "number" },
        { key: "includeTasks", value: true, kind: "boolean" }
      ],
      diagnostics: []
    });
  });

  it("allows only explicitly listed primitive defaults", () => {
    const configuration = parsePromptConfiguration({
      dynamicPrompt: {
        inputs: { visible: "yes", object: {}, list: [], infinite: Infinity },
        prompt: { inputs: ["visible", "object", "list", "infinite", "missing"] }
      }
    });

    expect(configuration.referenceDate).toBe(false);
    expect(configuration.inputs).toEqual([{ key: "visible", value: "yes", kind: "text" }]);
    expect(configuration.diagnostics).toHaveLength(4);
  });

  it("does not prompt templates without prompt configuration", () => {
    expect(parsePromptConfiguration({ dynamicPrompt: { inputs: { days: 7 } } })).toEqual({
      referenceDate: false,
      inputs: [],
      diagnostics: []
    });
  });

  it("reports malformed prompt configuration", () => {
    expect(parsePromptConfiguration({ dynamicPrompt: { prompt: { referenceDate: "yes", inputs: "days" } } }).diagnostics).toEqual([
      "dynamicPrompt.prompt.referenceDate must be a boolean.",
      "dynamicPrompt.prompt.inputs must be an ordered list of input names."
    ]);
  });
});
