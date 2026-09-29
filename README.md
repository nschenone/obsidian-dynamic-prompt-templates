# Dynamic Prompt Templates

An Obsidian plugin that renders Markdown prompt templates with [Knap](https://knap.md), then renders native fenced Dataview queries to static Markdown.

## Templates

Every Markdown file in the configured template folder is a Knap template. The shared renderer exposes:

- `referenceDate` — render date as `YYYY-MM-DD`
- `template.path`, `template.title`, and `template.description`
- `inputs` — frontmatter defaults shallow-merged with optional runtime inputs

Host-owned values above cannot be overridden by runtime inputs. Set defaults in template frontmatter:

```md
---
dynamicPrompt:
  inputs:
    audience: team
---
# {{ template.title }}
Prepared for {{ inputs.audience }} on {{ referenceDate }}.
```

Knap variables, filters, conditions, and loops use Knap syntax. This plugin additionally provides:

- `last_days`: a positive integer (maximum 365) produces inclusive ISO dates ending on `referenceDate`, useful in loops.
- `transclude`: includes an Obsidian note, heading, or block relative to the template, without frontmatter: `{{ "Notes/Plan#Next" | transclude }}`.
- `redact_lines`: removes whole lines whose trimmed text starts with the supplied prefix, case-insensitively: `{{ inputs.notes | redact_lines: "secret:" }}`.

Ordinary Obsidian wikilinks remain links. Native `dataview` fences are rendered after Knap. `dataviewjs` is rejected with a warning.

## Commands and API

The fast command renders with today and frontmatter defaults. **Render dynamic prompt template with inputs** preserves its command ID for existing keybindings and shows only the opt-in fields configured by the selected template. Configure an optional reference date and an ordered allowlist of primitive defaults:

```yaml
dynamicPrompt:
  inputs:
    days: 1
    audience: personal
    includeTasks: true
    internalValue: hidden
  prompt:
    referenceDate: true
    inputs:
      - days
      - audience
      - includeTasks
```

Prompt fields use their stored defaults and preserve string, finite-number, or boolean types when submitted. Inputs not listed under `prompt.inputs` are never shown or overridden. If neither `referenceDate: true` nor any valid prompt input is configured, the prompted command renders immediately using today and the defaults.

The local HTTP API has `GET /health`, `GET /templates`, and `POST /render`:

```bash
curl -X POST http://127.0.0.1:27131/render -H 'Content-Type: application/json' \
  -d '{"templatePath":"Templates/Prompts/Weekly.md","referenceDate":"2026-07-07","inputs":{"audience":"team"}}'
```

Companion plugins can call `window.dynamicPromptTemplatesApi.renderTemplateByPath(path, referenceDate, inputs)`.

The CLI forwards inputs with repeated `--input key=value`:

```bash
dynamic-prompt render "Templates/Prompts/Weekly.md" --reference-date 2026-07-07 --input audience=team
```

## Development

```bash
npm install
npm test
npm run build
```
