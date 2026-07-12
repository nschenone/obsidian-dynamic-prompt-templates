## Why

The current `dynamic-prompt list` output is technically correct but hard to scan because it renders each template as a single tab-separated line dominated by the full path. This makes the CLI feel rough compared with the Obsidian UI and slows down template selection when used directly in a terminal.

## What Changes

- Improve the human-readable `dynamic-prompt list` output so each template is easier to scan in a terminal.
- Present template titles and paths in a clearer layout while keeping path-based identifiers visible.
- Reuse the improved list formatting when the CLI prints available templates after a missing `render` target.
- Preserve the existing JSON output contract for automation and scripts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `prompt-template-access`: Update the CLI list presentation requirements so the default human-readable output is terminal-friendly while remaining path-based.

## Impact

- CLI formatting logic in `src/cli/core.ts`.
- CLI tests covering list and error output formatting.
- Documentation examples for the `dynamic-prompt list` command.
