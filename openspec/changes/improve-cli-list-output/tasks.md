## 1. CLI Formatting

- [ ] 1.1 Replace the tab-separated human-readable template list formatter with a title-first multiline formatter that still shows the exact template path
- [ ] 1.2 Reuse the same human-readable formatter when `dynamic-prompt render` is called without a template path

## 2. Verification And Docs

- [ ] 2.1 Update CLI tests to cover the new list output and missing-template error output while preserving `--json` behavior
- [ ] 2.2 Refresh the CLI documentation examples so they match the improved human-readable list presentation
