# prompt-template-access

## Purpose
Define how users and local tools discover prompt templates and access rendering flows across the Obsidian UI, HTTP API, and CLI.

## Requirements

### Requirement: Discover templates from one configured folder
The system SHALL treat every markdown file in one configured folder as a renderable prompt template.

#### Scenario: Include every markdown file in the configured folder
- **WHEN** the configured template folder contains multiple markdown files
- **THEN** the system lists each markdown file as an available template

#### Scenario: Use optional metadata for display
- **WHEN** a template contains frontmatter `title` or `description`
- **THEN** the system uses that metadata for display without making it part of the rendered prompt output

### Requirement: Provide command-palette rendering flows
The system SHALL expose command-palette actions for rendering a selected template with the default reference date and with an explicit reference-date override.

#### Scenario: Render with default reference date
- **WHEN** the user runs the default render command and selects a template
- **THEN** the system renders that template using the current date as the reference date

#### Scenario: Render with explicit reference date
- **WHEN** the user runs the date-override render command, selects a template, and supplies a reference date
- **THEN** the system renders that template using the supplied date as the reference date

### Requirement: Copy and preview rendered prompts in Obsidian
The system SHALL support clipboard copying and a rendered preview modal after command-palette renders.

#### Scenario: Auto-copy rendered markdown
- **WHEN** auto-copy is enabled and a template render completes from the command palette
- **THEN** the system copies the rendered markdown to the clipboard

#### Scenario: Show preview modal when enabled
- **WHEN** preview-after-render is enabled and a template render completes from the command palette
- **THEN** the system opens a preview modal containing the rendered markdown and any warnings

#### Scenario: Skip preview modal when disabled
- **WHEN** preview-after-render is disabled and a template render completes from the command palette
- **THEN** the system does not open the preview modal

### Requirement: Expose a desktop-only local HTTP API
The system SHALL provide an opt-in HTTP API on desktop that allows external tools to list templates and render templates by path.

#### Scenario: Keep API disabled by default
- **WHEN** the plugin is first installed
- **THEN** the local HTTP API is disabled until the user enables it in settings

#### Scenario: List templates over HTTP
- **WHEN** an API client requests the template list endpoint
- **THEN** the system returns structured JSON containing each template's vault-relative path and display metadata

#### Scenario: Render template over HTTP
- **WHEN** an API client requests template rendering with a template path and optional reference date
- **THEN** the system returns structured JSON containing the rendered markdown, reference date, template metadata, and warnings

### Requirement: Support configurable API network settings
The system SHALL allow users to configure the API host, port, and optional bearer-token authentication.

#### Scenario: Use optional bearer auth
- **WHEN** the API auth token is empty
- **THEN** the API accepts unauthenticated requests

#### Scenario: Enforce bearer auth when token is configured
- **WHEN** the API auth token is configured
- **THEN** the API rejects requests without a matching `Authorization: Bearer <token>` header

#### Scenario: Warn on non-loopback host configuration
- **WHEN** the configured API host is not a loopback-style host
- **THEN** the settings UI shows a warning that the API may be exposed beyond the local machine

### Requirement: Provide a non-interactive CLI wrapper
The system SHALL provide a CLI wrapper for local tools and agents that uses explicit template paths and stays non-interactive.

#### Scenario: List templates from CLI
- **WHEN** a user runs the CLI list command
- **THEN** the CLI returns the available templates using path-based identifiers

#### Scenario: Render markdown by default from CLI
- **WHEN** a user runs the CLI render command with a template path
- **THEN** the CLI prints only the rendered markdown to stdout by default

#### Scenario: Return structured output from CLI on request
- **WHEN** a user runs the CLI render command with `--json`
- **THEN** the CLI prints the structured API-style response including warnings and metadata

#### Scenario: Reject omitted template path in CLI render
- **WHEN** a user runs the CLI render command without a template path
- **THEN** the CLI exits non-zero after printing a helpful error and the available template identifiers

### Requirement: Support configurable week-start for rendering
The system SHALL allow users to configure the week-start boundary that prompt rendering uses for week-based date tokens.

#### Scenario: Save week-start preference in plugin settings
- **WHEN** a user selects a week-start option in plugin settings
- **THEN** the plugin persists that option and uses it for subsequent renders

#### Scenario: Share week-start behavior across render entry points
- **WHEN** a user configures a non-default week-start option and renders the same template through the command palette, local API, and CLI with the same reference date
- **THEN** each entry point produces the same resolved week-based date output
