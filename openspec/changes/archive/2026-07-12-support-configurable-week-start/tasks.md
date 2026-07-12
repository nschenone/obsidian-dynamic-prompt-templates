## 1. Settings And Contracts

- [x] 1.1 Extend `DynamicPromptSettings` and `DEFAULT_SETTINGS` with a persisted week-start option that preserves current behavior by default
- [x] 1.2 Add a plugin settings control that lets users choose the week-start boundary and saves it through the existing settings flow

## 2. Rendering Behavior

- [x] 2.1 Update the shared date-token resolution path to apply the configured week-start semantics when formatting week-based tokens
- [x] 2.2 Thread the new setting through the shared renderer without changing non-week-based token output or introducing entry-point-specific behavior

## 3. Verification And Docs

- [x] 3.1 Add or update unit tests for default week resolution and the Monday-based case where `2026-07-12` resolves to `2026-W28`
- [x] 3.2 Refresh README guidance so weekly token examples and settings documentation explain how week-start affects rendered output
