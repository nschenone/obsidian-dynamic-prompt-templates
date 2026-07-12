## Context

This change introduces a new native Obsidian plugin focused on one job: turning markdown prompt templates into flattened markdown that already contains the vault context an LLM needs. The workflow spans multiple surfaces: prompt-template discovery, markdown parsing, date-token resolution, wikilink and embed expansion, Dataview rendering, command-palette UX, clipboard and preview behavior, and a desktop-only HTTP/CLI bridge for external agents.

The agreed product constraints are intentionally narrow:
- Templates are ordinary markdown files in one configured folder.
- Template frontmatter is metadata for discovery, not prompt output.
- Native `dataview` blocks are supported; `dataviewjs` is not.
- Wikilinks and embeds are treated as include directives in templates.
- Date interpolation uses `{{...}}` format strings resolved against a single reference date per render.
- Failures are soft and visible in rendered markdown.
- External automation goes through a local HTTP API and thin CLI wrapper.

## Goals / Non-Goals

**Goals:**
- Provide a deterministic renderer for prompt-template markdown.
- Keep the template authoring model close to native Obsidian concepts.
- Support a fast in-app flow for rendering, previewing, and copying prompts.
- Expose the same rendering engine to external scripts and coding agents.
- Keep dependency handling graceful when Dataview is unavailable.

**Non-Goals:**
- Recreate Templater or execute arbitrary template JavaScript.
- Support `dataviewjs` in v1.
- Support recursive transclusion or nested execution of linked note content in v1.
- Depend on Periodic Notes for note resolution.
- Use the active file as an implicit template target for the API or CLI.

## Decisions

### Use one shared renderer across UI, API, and CLI
The plugin will implement a single rendering pipeline that accepts a template path and reference date, then returns rendered markdown plus warnings. Command-palette actions, the preview modal, the HTTP API, and the CLI client will all call that same pipeline.

Alternative considered: separate in-app and external renderers. Rejected because template behavior would drift and external tooling would become less trustworthy.

### Keep template syntax Obsidian-native
Templates remain plain markdown. The renderer will:
- strip template frontmatter before rendering,
- resolve `{{...}}` date tokens anywhere in the markdown body,
- expand `[[...]]` and `![[...]]` references into inline markdown,
- detect native `dataview` fences and replace them with static markdown results.

Alternative considered: custom fenced `dynamic-prompt` blocks. Rejected because the agreed use cases are already modeled cleanly by markdown, wikilinks, embeds, and Dataview.

### Resolve all date tokens against a single render-time reference date
Every render uses one reference date. The default is now/today; the alternate command and API/CLI inputs can override it. `{{...}}` tokens are treated as date format strings only, not mini-expressions.

Alternative considered: separate "this week" and "last week" syntax. Rejected because a single reference-date model is simpler and covers backfill without expanding the template language.

### Expand links one level deep and preserve source markdown structure
When a template references `[[Note]]` or `[[Note#Heading]]`, the renderer will read the target note, drop its frontmatter, and inline either the full body or the addressed section. Heading extraction will include the matched heading and its descendant content until the next heading of the same or higher level. Included content preserves its original heading levels.

Alternative considered: recursive link expansion and heading normalization. Rejected for v1 because both increase context explosion and make output less predictable.

### Treat missing content and unsupported features as soft failures
The renderer will not abort on missing notes, missing headings, missing Dataview, or unsupported `dataviewjs`. Instead it emits warning callouts inline and returns a warning summary with the render result.

Alternative considered: hard-fail rendering. Rejected because partial prompt output is still useful for backfill and agent workflows.

### Require no hard dependency on Dataview at plugin load time
The plugin can run without Dataview, but `dataview` blocks only render when the Dataview plugin is installed and enabled. Otherwise the renderer inserts warning callouts in place of those blocks.

Alternative considered: make Dataview a hard plugin dependency. Rejected because non-Dataview template features still provide value and should keep working.

### Expose external access through a desktop-only HTTP API plus CLI wrapper
The plugin will start an opt-in HTTP server on desktop only. The server is configurable for host and port, with optional bearer-token auth. A thin CLI wrapper provides stable commands such as `list` and `render` while keeping the HTTP response structured and the CLI output markdown-first by default.

Alternative considered: file-based request/response, URI-only automation, or direct CLI `eval` coupling. Rejected because HTTP is a cleaner and more extensible precedent for external tooling.

### Use path-based template identity
Templates are identified by vault-relative path. Picker labels can use frontmatter `title` or filename, but API and CLI contracts use the path as the stable identifier.

Alternative considered: title-based ids. Rejected because collisions are too likely once users add more than a few templates.

## Risks / Trade-offs

- [Dataview output shape may differ from what users see visually] -> Convert Dataview results into conservative static markdown that preserves query ordering and main result shape instead of trying to mimic every UI nuance.
- [Large linked sections can create oversized prompts] -> Keep v1 non-recursive, heading-scoped when requested, and expose the rendered output in a preview modal so users can inspect before use.
- [Host customization can expose the API beyond loopback] -> Default to `127.0.0.1`, warn clearly for non-loopback hosts, and document reverse-proxy/auth expectations.
- [Wikilinks used as literal links inside templates will now inline content] -> Document that templates are renderer inputs, not ordinary notes, and scope the behavior only to files inside the configured template folder.
- [Obsidian/plugin API differences across environments] -> Keep the external contract thin and avoid relying on active-file state or undocumented bridge assumptions in the CLI.

## Migration Plan

1. Create the plugin with settings for template folder, preview/copy behavior, and API host/port/auth.
2. Implement the shared renderer and wire it to command-palette flows first.
3. Add the preview modal and clipboard integration.
4. Add the HTTP API endpoints and the CLI wrapper that consumes them.
5. Document template syntax, warning behavior, and example workflows.

Rollback strategy: disable the plugin or the HTTP API setting. The feature stores no custom database state and does not require vault migrations.

## Open Questions

- Exact JSON field names for API warnings and template metadata can still be finalized during implementation.
- The final CLI packaging format is open as long as it remains a thin local wrapper over the plugin API.
