## 1. Plugin Foundation

- [x] 1.1 Scaffold the Obsidian plugin package, manifest, build setup, and desktop-safe module boundaries for renderer, UI, and API code
- [x] 1.2 Add plugin settings for template folder, preview-after-render, auto-copy, API enablement, API host, API port, and optional API auth token
- [x] 1.3 Implement template discovery by configured folder using vault-relative path ids plus optional frontmatter `title` and `description` metadata

## 2. Shared Rendering Engine

- [x] 2.1 Implement template loading that strips template frontmatter and resolves `{{...}}` date tokens from a supplied reference date
- [x] 2.2 Implement wikilink and embed expansion for full-note and heading-scoped includes while excluding included-note frontmatter and preserving source heading levels
- [x] 2.3 Implement one-level render behavior that avoids recursive link expansion while reusing cached lookups for repeated references in a single render
- [x] 2.4 Implement soft-failure warning generation for missing notes, missing headings, and other unresolved includes

## 3. Dataview Rendering

- [x] 3.1 Detect native `dataview` fences in template content and route them through the shared renderer
- [x] 3.2 Integrate with the Dataview plugin API to convert supported query results into static markdown tables and lists
- [x] 3.3 Replace unsupported `dataviewjs` blocks and unavailable Dataview renders with warning callouts that are also returned in the render summary

## 4. Obsidian Commands And Preview UX

- [x] 4.1 Add command-palette flows for rendering a selected template with the default reference date and with an explicit reference-date override
- [x] 4.2 Implement clipboard copying and the rendered preview modal with warning display plus a manual copy fallback action
- [x] 4.3 Respect preview and auto-copy settings in the command flows and show clear notices for completed renders or partial-warning renders

## 5. External Access Surface

- [x] 5.1 Implement a desktop-only opt-in HTTP API that exposes template listing and path-based rendering endpoints backed by the shared renderer
- [x] 5.2 Implement configurable host, port, and optional bearer-token auth handling plus a settings warning for non-loopback hosts
- [x] 5.3 Build a thin non-interactive CLI wrapper with `list` and `render` commands, markdown-first stdout output, and `--json` structured output support

## 6. Documentation And Verification

- [x] 6.1 Document template authoring rules, supported syntax, warning behavior, and API/CLI usage with examples for weekly-reflection-style prompts
- [x] 6.2 Add automated coverage for date-token resolution, heading extraction, Dataview replacement, warning generation, API auth behavior, and CLI output modes
- [x] 6.3 Perform end-to-end manual verification in Obsidian for template selection, preview/copy flow, HTTP rendering, and CLI rendering against the same template path
