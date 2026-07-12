## Context

The CLI currently formats `dynamic-prompt list` output as one tab-separated line per template: full path first, title second. That satisfies the path-based identifier requirement but produces a poor terminal experience because long paths dominate the line and the human-friendly title is visually de-emphasized. The same formatting is reused when `dynamic-prompt render` is called without a template path, so the usability issue appears in both discovery and error-recovery flows.

## Goals / Non-Goals

**Goals:**
- Make the default CLI list output easier to scan in a terminal.
- Keep template paths visible so users can still copy exact identifiers for later commands.
- Reuse the improved formatter in both `list` output and missing-template error output.
- Preserve the existing JSON output contract for scripts and automation.

**Non-Goals:**
- Change the HTTP API response shape.
- Add interactivity, paging, or fuzzy search to the CLI.
- Change how templates are identified internally.

## Decisions

### Use a title-first multiline layout for human-readable list output
The CLI will format each template as a small block instead of a tab-separated row. The title should appear first, with the path on the next indented line. This improves scanability while still exposing the exact path users need for `render`.

Alternative considered: keep single-line output and reverse the columns. Rejected because long paths would still make the output noisy and hard to read.

### Reuse one formatter for list and render-error template suggestions
The formatter used by `dynamic-prompt list` should also be used when `dynamic-prompt render` fails because no template path was provided. That keeps the CLI consistent and avoids maintaining two different display styles.

Alternative considered: separate list and error formatters. Rejected because the same information is being presented in both cases.

### Preserve JSON output exactly
`--json` output should remain unchanged so scripts and agent integrations do not need updates.

Alternative considered: enhance JSON with display-oriented fields. Rejected because the problem is with human-readable output only.

## Risks / Trade-offs

- [Multiline output is less compact when many templates exist] -> Prefer scanability over density for human-readable mode while preserving `--json` for machine-friendly consumption.
- [Users may expect path-first output from earlier behavior] -> Keep the full path visible in every entry so the identifier remains easy to copy.

## Migration Plan

1. Update CLI formatting helpers for human-readable template lists.
2. Reuse the formatter in the missing-template-path error path.
3. Update tests for both list and render-error output.
4. Refresh documentation examples.

Rollback strategy: revert the formatter changes; no persisted data or API migrations are involved.

## Open Questions

- None at this time.
