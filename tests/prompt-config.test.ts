import { describe, expect, it } from "vitest";
import { coercePromptInputValue, createPromptValues, parsePromptConfiguration, shouldPromptForInputs } from "../src/prompt-config";

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

  it("submits typed allowlisted values and omits an unprompted reference date", () => {
    const configuration = parsePromptConfiguration({
      dynamicPrompt: {
        inputs: { count: 1, enabled: false, label: "default", hidden: "unchanged" },
        prompt: { inputs: ["count", "enabled", "label"] }
      }
    });
    const values = {
      count: coercePromptInputValue(configuration.inputs[0]!, "42"),
      enabled: coercePromptInputValue(configuration.inputs[1]!, true),
      label: coercePromptInputValue(configuration.inputs[2]!, "updated"),
      hidden: "must not be submitted"
    };

    expect(createPromptValues(configuration, "2026-07-07", values)).toEqual({
      referenceDate: undefined,
      inputs: { count: 42, enabled: true, label: "updated" }
    });
  });

  it("keeps no-prompt and no-valid-field command paths direct", () => {
    const configured = parsePromptConfiguration({
      dynamicPrompt: { inputs: { days: 1 }, prompt: { referenceDate: true, inputs: ["days"] } }
    });
    const noValidFields = parsePromptConfiguration({
      dynamicPrompt: { inputs: { nested: {} }, prompt: { inputs: ["nested"] } }
    });

    expect(shouldPromptForInputs(false, configured)).toBe(false);
    expect(shouldPromptForInputs(true, noValidFields)).toBe(false);
  });
});
