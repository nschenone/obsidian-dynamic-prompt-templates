## Why

Obsidian users can already store prompt templates as markdown, but there is no focused way to render those templates into a ready-to-send prompt that inlines live vault context such as linked note sections, date-based note references, and Dataview results. The missing piece is a native Obsidian workflow that can turn a prompt note into flattened markdown for copy/paste and agent use without requiring Templater-style scripting or manual assembly.

## What Changes

- Add a native Obsidian plugin that treats markdown files in a configured folder as dynamic prompt templates.
- Render template prose into final markdown while resolving `{{...}}` date tokens against a render-time reference date.
- Expand wikilinks and embeds in templates into inline markdown content, including heading-scoped extraction for `[[Note#Heading]]` references.
- Detect native `dataview` code fences, execute them when Dataview is available, and replace them with static markdown output.
- Surface soft failures as warning callouts in rendered output for missing notes, missing headings, unsupported `dataviewjs`, or unavailable Dataview rendering.
- Add command palette flows for default-date rendering and explicit reference-date rendering, with clipboard copy and an optional preview modal.
- Add a desktop-only local HTTP API and thin CLI wrapper so coding agents and scripts can list templates and request rendered prompt output by template path.

## Capabilities

### New Capabilities
- `prompt-template-rendering`: Render markdown prompt templates into flattened markdown by resolving date tokens, note references, embeds, and Dataview queries.
- `prompt-template-access`: Expose rendered prompt templates through Obsidian commands, preview/copy UX, and a local API/CLI contract for external tools.

### Modified Capabilities

None.

## Impact

- New Obsidian plugin code for template discovery, parsing, rendering, warning generation, preview UI, clipboard behavior, and settings.
- Integration with the Dataview plugin API when available.
- New desktop-only local HTTP server and companion CLI surface for external invocation.
- New documentation and examples for template syntax, rendering rules, and API usage.
