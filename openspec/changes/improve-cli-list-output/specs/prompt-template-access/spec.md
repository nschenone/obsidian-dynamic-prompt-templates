## MODIFIED Requirements

### Requirement: Provide a non-interactive CLI wrapper
The system SHALL provide a CLI wrapper for local tools and agents that uses explicit template paths and stays non-interactive.

#### Scenario: List templates from CLI in a terminal-friendly format
- **WHEN** a user runs the CLI list command without `--json`
- **THEN** the CLI returns the available templates as human-readable entries that emphasize the template title while still showing the exact path-based identifier for each template

#### Scenario: Preserve structured output from CLI on request
- **WHEN** a user runs the CLI list or render command with `--json`
- **THEN** the CLI prints the structured API-style response without switching to the human-readable terminal formatter

#### Scenario: Render markdown by default from CLI
- **WHEN** a user runs the CLI render command with a template path
- **THEN** the CLI prints only the rendered markdown to stdout by default

#### Scenario: Return structured render output from CLI on request
- **WHEN** a user runs the CLI render command with `--json`
- **THEN** the CLI prints the structured API-style response including warnings and metadata

#### Scenario: Show available templates in the same human-readable format on missing render target
- **WHEN** a user runs the CLI render command without a template path and without `--json`
- **THEN** the CLI exits non-zero after printing a helpful error and the available templates using the same human-readable formatter as the list command
