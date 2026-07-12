## MODIFIED Requirements

### Requirement: Resolve date tokens from a render reference date
The system SHALL resolve every `{{...}}` date token against one render-time reference date, using the token contents as a date format string and the configured week-start semantics for week-based tokens.

#### Scenario: Resolve date token in plain prose
- **WHEN** a template contains `{{YYYY-MM-DD}}` and the render reference date is `2026-07-07`
- **THEN** the rendered output includes `2026-07-07` in the corresponding position

#### Scenario: Resolve date token inside a note reference
- **WHEN** a template contains `[[{{YYYY/gggg-[W]ww}}#Wins]]` and the render reference date resolves to `2026/2026-W28`
- **THEN** the renderer resolves the target note path using `2026/2026-W28` before loading the linked content

#### Scenario: Resolve week token with Monday week start
- **WHEN** the configured week start is Monday and a template contains `{{gggg-[W]ww}}` for render reference date `2026-07-12`
- **THEN** the rendered output includes `2026-W28`

#### Scenario: Preserve default week resolution when setting is unchanged
- **WHEN** the week-start setting remains at its default value and a template contains `{{gggg-[W]ww}}` for render reference date `2026-07-12`
- **THEN** the rendered output matches the plugin's existing default week-number behavior
