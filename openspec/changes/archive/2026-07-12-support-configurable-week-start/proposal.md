## Why

Week-based date tokens currently inherit Moment's default week semantics, which can resolve the same calendar date to an unexpected week number for users who organize weekly notes around a different week boundary. This makes templates that rely on `{{gggg-[W]ww}}` brittle for weekly workflows and forces users to rewrite templates around one hard-coded convention.

## What Changes

- Add a user-configurable week-start setting that controls how week-based date tokens are resolved during template rendering.
- Apply the configured week-start consistently across Obsidian commands, the local API, and the CLI when rendering a template with a reference date.
- Preserve existing behavior for non-week-based date tokens and provide a sensible default for users who do not change the new setting.
- Update tests and documentation to cover week-number resolution with a non-default week start.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `prompt-template-rendering`: Date token resolution must honor a configured week-start boundary when formatting week-based tokens.
- `prompt-template-access`: Users must be able to configure the week-start boundary that rendering uses across all entry points.

## Impact

- Rendering utilities in `src/utils/markdown.ts` and the render pipeline in `src/renderer.ts`.
- Settings contracts, defaults, and UI for the plugin configuration.
- CLI and API flows that rely on the shared renderer.
- Documentation and tests covering weekly date token behavior.
