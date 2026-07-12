# Dynamic Prompt Templates

An Obsidian plugin that renders markdown prompt templates into flattened markdown for copy/paste and agent use.

## What it does

- Treats every markdown file in a configured template folder as a prompt template
- Resolves `{{...}}` date tokens from a render-time reference date
- Expands wikilinks and embeds into inline markdown content
- Renders native `dataview` blocks to static markdown when Dataview is available
- Shows soft-failure warning callouts for missing notes, missing headings, unavailable Dataview, and unsupported `dataviewjs`
- Exposes the same renderer through Obsidian commands, a preview modal, a local HTTP API, and a CLI wrapper

## Template syntax

Templates are just markdown.

### Date tokens

Use moment-style format tokens anywhere in the template body:

```md
Today is {{YYYY-MM-DD}}.
This report covers week {{gggg-[W]ww}}.
```

Week-number tokens follow the plugin's configured `Week start` setting. With the default `Sunday` setting, `2026-07-12` resolves to `2026-W29`; with `Monday`, the same date resolves to `2026-W28`.

### Note includes

Wikilinks and embeds are treated as include directives:

```md
## Wins
[[{{YYYY/gggg-[W]ww}}#Wins]]

## Priorities
![[Projects/Quarter Plan#Current Priorities]]
```

`[[Note]]` includes the full note body without frontmatter.

`[[Note#Heading]]` includes that heading and its descendant content until the next heading of the same or higher level.

### Dataview

Native `dataview` blocks are rendered to static markdown:

````md
```dataview
TABLE status, priority
FROM "Collections/Tasks"
WHERE status != "done"
SORT priority ASC
```
````

`dataviewjs` is not supported in v1 and renders as a warning callout.

## Commands

- `Dynamic Prompt Templates: Render dynamic prompt template`
- `Dynamic Prompt Templates: Render dynamic prompt template with date`

The default command uses the current date as the reference date.

The date command prompts for an explicit `YYYY-MM-DD` reference date.

## Local API

The local API is disabled by default.

Settings:

- week start for week-based date tokens
- host
- port
- optional bearer token

The `Week start` setting applies to every render entry point because the command palette, local API, and CLI all use the same shared renderer.

Endpoints:

- `GET /health`
- `GET /templates`
- `POST /render`

Example render request:

```bash
curl -X POST http://127.0.0.1:27131/render \
  -H "Content-Type: application/json" \
  -d '{"templatePath":"Templates/Prompts/Weekly Reflection.md","referenceDate":"2026-07-07"}'
```

If you configure an auth token, send:

```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

## CLI

List templates:

```bash
dynamic-prompt list
```

Render a template:

```bash
dynamic-prompt render "Templates/Prompts/Weekly Reflection.md"
```

Render with a reference date:

```bash
dynamic-prompt render "Templates/Prompts/Weekly Reflection.md" --reference-date 2026-07-07
```

Return structured JSON instead of markdown-only output:

```bash
dynamic-prompt render "Templates/Prompts/Weekly Reflection.md" --json
```

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build the plugin and CLI:

```bash
npm run build
```
