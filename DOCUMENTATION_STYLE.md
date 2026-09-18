# Broken Compass documentation style

This checkpoint establishes a small presentation baseline for the knowledge reader and Document Manager.

## Voice and structure

- Use active voice and address the reader as “you.”
- Use sentence case for headings.
- Keep sections focused on one reader task.
- Prefer short paragraphs, direct steps, and concrete labels.
- Use inline code for commands, resource names, file names, and configuration values.

## Canonical Markdown

- Markdown remains the portable source of truth.
- Every document declares `title` and `default_visibility` in YAML frontmatter.
- Public is the normal default visibility.
- Put restricted content in coherent, non-nested `:::access` blocks.
- Do not type access directives inside a manager section. Assign visibility through the section control.

## Visual language

- Use the existing warm brown Broken Compass palette with cream text and restrained accents.
- Use serif type for document titles and major editorial headings.
- Use sans-serif type for controls, navigation, and supporting text.
- Use monospace type for Markdown editing and technical identifiers.
- Keep long-form reading surfaces high contrast and comfortably spaced.

## Visibility colors in the manager

- Public: warm tan
- Moderator: teal
- Developer: blue
- Administrator: muted red

Color reinforces the written visibility label; it is never the only signal.
