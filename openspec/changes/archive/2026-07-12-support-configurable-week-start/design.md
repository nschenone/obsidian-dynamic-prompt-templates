## Context

The renderer currently resolves every `{{...}}` token by calling `moment(referenceDate).format(...)` with no render-specific week configuration. That means locale week tokens such as `gggg` and `ww` inherit Moment's default locale behavior, which currently places `2026-07-12` in `2026-W29`. Users who organize weekly notes on a Monday-based cadence need that same date to resolve to `2026-W28`, and the shared renderer means any fix must apply consistently in the Obsidian UI, local API, and CLI.

## Goals / Non-Goals

**Goals:**
- Let users choose the week boundary used when resolving week-based date tokens.
- Apply the configured behavior consistently everywhere the shared renderer is used.
- Preserve existing rendered output for users who keep the default setting.
- Document and test the Monday-based case where `2026-07-12` resolves to `2026-W28`.

**Non-Goals:**
- Add per-render overrides for week-start in commands, API requests, or CLI flags.
- Replace Moment with a different date library.
- Change the behavior of non-week-based date tokens.

## Decisions

### Add one persisted plugin setting for week-start semantics
Add a new setting to the shared plugin settings contract and defaults so the renderer can read one canonical week-start choice. The initial scope should support the practical weekly workflows this plugin targets, with values that clearly express the chosen boundary in the settings UI.

Alternative considered: add a CLI/API-only flag or encode the choice in template syntax. Rejected because rendering already flows through shared plugin settings and the problem is a reusable vault-level preference, not a one-off per render.

### Apply week configuration inside the renderer instead of rewriting templates
The renderer should resolve date tokens using a Moment configuration derived from the saved week-start setting. This keeps templates unchanged and ensures the same token string produces the expected week value regardless of whether rendering is triggered from the command palette, API, or CLI.

Alternative considered: require users to switch from locale week tokens to a different token family manually. Rejected because it leaks date-library quirks into templates and does not solve existing templates that already rely on `gggg-[W]ww`.

### Keep the configuration render-scoped rather than mutating global behavior
Week-start handling should be applied in a way that is local to prompt rendering so the plugin does not unexpectedly change global Moment behavior for the rest of Obsidian or other plugin code.

Alternative considered: mutate the global default locale week config. Rejected because it creates hidden cross-plugin coupling and makes behavior harder to reason about.

## Risks / Trade-offs

- [Week numbering semantics are more complex than a single day boundary] -> Limit the initial setting to clearly documented week-start modes and verify them with concrete date-based tests.
- [Existing users may rely on the current Sunday-based behavior] -> Keep the default aligned with current behavior and make the alternative opt-in.
- [Moment locale APIs can be easy to misuse] -> Centralize the week-aware formatting logic in one helper and cover it with direct unit tests.

## Migration Plan

1. Extend settings contracts, defaults, and settings UI with the new week-start option.
2. Update date-token resolution to use the configured week semantics in the shared renderer.
3. Add tests for both default behavior and Monday-based weekly resolution.
4. Update README examples and settings documentation.

Rollback strategy: remove the new setting and restore the current date-token formatter; no persisted content migration beyond one optional settings field is required.

## Open Questions

- None at this time.
