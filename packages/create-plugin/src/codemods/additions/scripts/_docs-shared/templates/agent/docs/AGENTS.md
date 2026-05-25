---
name: plugin docs authoring guide
description: Guides how AI agents author, maintain, review and validate the multi-page docs for {{pluginName}}
---

# Plugin docs authoring

> **Path conventions:** This file lives at the path configured in `src/plugin.json` via the `docsPath` field (default: `docs`). Throughout this file and the bundled skills, `<docsPath>/` refers to that same folder. Substitute the actual value wherever you see it.

This folder contains the multi-page documentation for the **{{pluginName}}** plugin. Pages here are rendered by `@grafana/plugin-docs-parser` and published to `grafana.com/grafana/plugins/<slug>/docs/<page>`.

If you are filling in stub pages, maintaining docs alongside code changes or adding new pages, read this file first. Four skills, scaffolded under your agent loop's skills folder (`.claude/skills/`, `.agents/skills/` or `.cursor/skills/`), cover the common workflows.

## Frontmatter schema

Every page starts with a YAML frontmatter block:

```yaml
---
title: Configuration # required - the H1 / nav label
description: Learn how to ... # required - short page meta, used for SEO and sidebar previews
sidebar_position: 2 # required - controls ordering in the docs nav (lower = earlier)
deprecated: false # optional - hides the page from nav when true
---
```

## Filesystem conventions

- One Markdown file per page. Filename in `kebab-case`.
- Nested folders become nested URLs (Docusaurus-style). `<docsPath>/setup/iam.md` becomes `.../<docsPath>/setup/iam`.
- No MDX, no React components, no `<script>` tags. Plain Markdown only.
- Images go under `<docsPath>/img/` and are referenced relatively.
- No links to internal-only URLs or staging environments.

### Group closely-coupled pages into folders

When two or more pages share a single topic - for example a configuration overview plus several auth-method walkthroughs, or a query-editor overview plus one page per query type - put them in a folder instead of as flat siblings:

```
<docsPath>/configuration/index.md            # overview, shared steps, links to children
<docsPath>/configuration/service-account.md  # one auth method
<docsPath>/configuration/oauth.md            # another auth method
```

Rather than:

```
<docsPath>/configuration.md
<docsPath>/service-account.md      # less discoverable, scope ambiguous
<docsPath>/oauth.md
```

The folder's `index.md` is the parent page (carries the topic overview and links to the children). Each child gets its own `sidebar_position` to control nav order within the folder. Apply this whenever you have a page-level relationship that's tighter than "they both happen to exist in the docs folder".

## Style rules

These are the canonical voice rules for plugin docs. Apply them when writing or editing any page.

1. **Present tense.** Not "will process" - just "processes".
2. **Active voice.** Not "the request is processed by the server" - "the server processes the request".
3. **Second person.** Address the reader as "you", not "we" or "our".
4. **Avoid filler adjectives.** Cut "easy", "simple", "just", "obviously".
5. **No exclamation marks** in body text.
6. **Bold for UI elements.** "Click **Save & test**." Not italics, not code formatting.
7. **Code formatting for commands, paths and values.** "Set `region` to `us-east-1`."
8. **Descriptive link text.** Never "click here" or "this link". The link text should make sense out of context.
9. **Contractions are fine.** "Don't" and "it's" are OK.
10. **Inclusive language.** Avoid gendered defaults and ableist phrasing.
11. **"refer to" not "see"** when linking to another doc.
12. **No spaces around em dashes.** Right: word—word. Wrong: word - word.
13. **Sentence case for headings.** "Before you begin", not "Before You Begin".

For deeper guidance, refer to the [Grafana Writers' Toolkit](https://grafana.com/docs/writers-toolkit/write/style-guide/).

## The agent-hint protocol

Scaffolded pages contain blocks like this under each section heading:

```markdown
## Before you begin

<!-- agent-hint:start -->

List prerequisites, required permissions, network connectivity, and any
account-level setup users must complete before installing or configuring
{{pluginName}} in Grafana.

<!-- agent-hint:end -->
```

Each block narrowly scopes the section it sits under. When filling a section:

1. Read the hint.
2. Write the section using the hint as scope guidance. For source-backed sections, read the source files implied by the page title and hint (the bootstrap-plugin-docs skill's page catalog lists conventional source-to-page mappings for the plugin type).
3. Strip the hint block (`<!-- agent-hint:start --> ... <!-- agent-hint:end -->`) once the section is filled.

Hint blocks are plain HTML comments, so the parser ignores them if accidentally left in - but strip them anyway, they are noise.

## Skills

Four skills support docs work. Each is a [Agent Skills](https://agentskills.io) directory under your agent loop's skills folder (`.claude/skills/<name>/SKILL.md`, `.agents/skills/<name>/SKILL.md` or `.cursor/skills/<name>/SKILL.md`):

- **`bootstrap-plugin-docs`** - one-shot, plugin-wide. Mines `README.md` plus source files, routes existing content to the right stub pages, prompts for non-source-backed topics. Run this once after scaffolding if the plugin already has substantive docs in the README.
- **`write-plugin-docs`** - per-page. Fills a stub page or updates an existing one. Reads the source files implied by the page title and section hints so it always works from current source.
- **`review-plugin-docs`** - plugin-specific review against the 13 rules above, frontmatter requirements, agent-hint cleanup and factual alignment with source files.
- **`validate-plugin-docs`** - runs `npm run docs:validate --json`, groups diagnostics, applies fixes and re-runs up to 3 iterations.

## Adding a new page

The `bootstrap-plugin-docs` skill carries a per-plugin-type page catalog with conventional filenames for the optional pages the codemod doesn't scaffold up front. When you need to add a new page, consult that catalog for the canonical name. If no entry fits, pick a `kebab-case` filename, choose a `sidebar_position` that puts the page where it belongs in the nav order and run `write-plugin-docs`.

## Do not

- Use MDX, custom React components or HTML beyond the `<!-- agent-hint -->` blocks.
- Reference one-click installation - it has been removed from the plugin catalog.
- Link to internal-only URLs (anything on `*.grafana-ops.net` or staging environments).
- Invent query fields, configuration options or behaviours. If a page is source-backed, document only what is visible in the source files you read.
- Generate images. Flag missing images for the author to add.
- Use `--` (double hyphens). Use a single `-` or an em dash `—`.

## Validation

```bash
npm run docs:validate            # runs in strict mode; fails on any error
npm run docs:validate -- --json  # machine-readable output for the validate-plugin-docs skill
npm run docs:serve               # local preview on port 3001
```
