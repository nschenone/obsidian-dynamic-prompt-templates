## ADDED Requirements

### Requirement: Support configurable week-start for rendering
The system SHALL allow users to configure the week-start boundary that prompt rendering uses for week-based date tokens.

#### Scenario: Save week-start preference in plugin settings
- **WHEN** a user selects a week-start option in plugin settings
- **THEN** the plugin persists that option and uses it for subsequent renders

#### Scenario: Share week-start behavior across render entry points
- **WHEN** a user configures a non-default week-start option and renders the same template through the command palette, local API, and CLI with the same reference date
- **THEN** each entry point produces the same resolved week-based date output
