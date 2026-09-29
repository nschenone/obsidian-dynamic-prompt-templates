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

The fast command renders with today and frontmatter defaults. The prompted command requests only a reference date and days (1–365); days is available as `inputs.days`.

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
