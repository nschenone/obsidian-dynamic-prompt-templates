## ADDED Requirements

### Requirement: Render prompt templates as flattened markdown
The system SHALL render a template note from the configured template folder into a single markdown document that preserves the template's prose and replaces dynamic constructs with static markdown output.

#### Scenario: Render template body without template frontmatter
- **WHEN** a template note contains YAML frontmatter followed by markdown body content
- **THEN** the rendered output includes only the markdown body content and excludes the template frontmatter

#### Scenario: Replace dynamic constructs inline
- **WHEN** a template contains ordinary prose, note references, embeds, or supported query blocks
- **THEN** the rendered output preserves the prose and replaces each dynamic construct in place with rendered markdown content

### Requirement: Resolve date tokens from a render reference date
The system SHALL resolve every `{{...}}` date token against one render-time reference date, using the token contents as a date format string.

#### Scenario: Resolve date token in plain prose
- **WHEN** a template contains `{{YYYY-MM-DD}}` and the render reference date is `2026-07-07`
- **THEN** the rendered output includes `2026-07-07` in the corresponding position

#### Scenario: Resolve date token inside a note reference
- **WHEN** a template contains `[[{{YYYY/gggg-[W]ww}}#Wins]]` and the render reference date resolves to `2026/2026-W28`
- **THEN** the renderer resolves the target note path using `2026/2026-W28` before loading the linked content

### Requirement: Expand note references and embeds into markdown content
The system SHALL treat wikilinks and embeds inside a template as include directives and inline the referenced note content as markdown.

#### Scenario: Inline a full note body
- **WHEN** a template contains `[[Project Alpha]]`
- **THEN** the renderer includes the body of `Project Alpha` without that note's frontmatter

#### Scenario: Inline a heading section
- **WHEN** a template contains `[[Weekly Note#Wins]]`
- **THEN** the renderer includes the `Wins` heading and all content beneath it until the next heading of the same or higher level

#### Scenario: Treat embeds the same as wikilinks
- **WHEN** a template contains `![[Weekly Note#Wins]]`
- **THEN** the renderer includes the same markdown content that `[[Weekly Note#Wins]]` would produce

### Requirement: Preserve included markdown structure
The system SHALL preserve the original markdown structure of included content rather than rewriting heading levels or recursively expanding linked notes.

#### Scenario: Preserve source heading level
- **WHEN** a referenced section begins with `## Wins`
- **THEN** the rendered output includes `## Wins` rather than normalizing it relative to the insertion point

#### Scenario: Do not recursively expand linked notes
- **WHEN** an included section contains additional wikilinks in its own body
- **THEN** the renderer leaves those inner links as markdown text instead of expanding them during the same render

### Requirement: Render native Dataview blocks to static markdown
The system SHALL detect native `dataview` code fences in templates and replace them with static markdown output derived from the Dataview query result.

#### Scenario: Render table query to markdown table
- **WHEN** a template contains a native `dataview` table query and Dataview is installed and enabled
- **THEN** the renderer replaces the code fence with a markdown table representing the query result

#### Scenario: Render list-style query to markdown list
- **WHEN** a template contains a native `dataview` list or task query and Dataview is installed and enabled
- **THEN** the renderer replaces the code fence with markdown that matches the resulting list structure

### Requirement: Warn on unsupported or unavailable query execution
The system SHALL surface unsupported query types or unavailable Dataview execution as warning callouts in rendered output instead of failing the entire render.

#### Scenario: Warn when Dataview is unavailable
- **WHEN** a template contains a native `dataview` block and the Dataview plugin is missing or disabled
- **THEN** the renderer replaces that block with a warning callout explaining that Dataview rendering is unavailable

#### Scenario: Warn on dataviewjs
- **WHEN** a template contains a `dataviewjs` block
- **THEN** the renderer replaces that block with a warning callout explaining that `dataviewjs` is unsupported in v1

### Requirement: Surface missing content as soft failures
The system SHALL keep rendering when linked content cannot be resolved and SHALL emit visible warning callouts for each unresolved reference.

#### Scenario: Missing note reference
- **WHEN** a template references a note that does not exist
- **THEN** the renderer inserts a warning callout identifying the missing note at that location in the output

#### Scenario: Missing heading reference
- **WHEN** a template references an existing note with a heading that does not exist
- **THEN** the renderer inserts a warning callout identifying the missing heading at that location in the output
