---
name: write-plugin-docs
description: Authors or updates a single plugin docs page. Consults the source files implied by the page's section hints and title to keep content grounded in current code, and applies the project's style rules from `<docsPath>/AGENTS.md`. Use when filling a stub page, adding a new page, or updating docs after a code change.
---

# Write Plugin Docs

> **Path conventions:** Throughout this skill, `<docsPath>/` refers to the docs folder configured in `src/plugin.json` via the `docsPath` field (default: `docs`). Read that value before following any step that touches a path inside the docs folder.

## Usage

```
/write-plugin-docs <page-path>
```

Run from the plugin root. The page path can be an existing doc page (e.g. `<docsPath>/query-editor.md`) or a topic the user wants documented for the first time (e.g. "IAM user setup").

Read `<docsPath>/AGENTS.md` before writing. It defines the frontmatter schema, voice rules, agent-hint protocol and the common page patterns catalog.

## Branch A: filling or updating an existing page

1. Read the target page. Identify every `<!-- agent-hint:start --> ... <!-- agent-hint:end -->` block. Each sits under a section heading and scopes that section.

2. Identify the source files that back the page. The page title and the agent-hint text imply the right source - the bootstrap-plugin-docs skill's page catalog lists conventional source-to-page mappings for the plugin type. Use grep, file listing and the import graph to find them.

3. Read those source files. Only document fields, behaviours and types visible in the files you read. Do not invent.

4. Read 1-2 sibling pages in the same `<docsPath>/` folder for tone and structure consistency.

5. Fill each section in place. For each section:
   - Use the hint as scope guidance.
   - Apply the style rules from `<docsPath>/AGENTS.md`.
   - Use real code examples drawn from source, not invented.
   - For numbered-step procedures, write a clean ordered list with one action per step.
   - For example queries, use the `dashboard.json` `targets` JSON shape, not free prose.

6. Strip every `agent-hint` block after the corresponding section is written. The block format is exactly:

   ```html
   <!-- agent-hint:start -->
   ...
   <!-- agent-hint:end -->
   ```

7. Validate:

   ```bash
   npm run docs:validate -- --json
   ```

   Fix any errors reported. Re-run until clean.

8. Optional visual check:
   ```bash
   npm run docs:serve
   ```

## Branch B: creating a brand-new page

1. Check the page catalog in the `bootstrap-plugin-docs` skill. If the requested topic matches a catalogued pattern, use that filename and scope.

2. **Check whether the new topic is tightly coupled to an existing page.** If so, restructure as a folder rather than creating a flat sibling. For example, if you are creating `service-account-setup.md` and `<docsPath>/configuration.md` already exists with overlapping scope, restructure both into:
   - `<docsPath>/configuration/index.md` (the existing configuration content moves here)
   - `<docsPath>/configuration/service-account-setup.md` (the new page)

   Confirm the restructure with the user before moving the existing file. Refer to "Group closely-coupled pages into folders" in `<docsPath>/AGENTS.md` for the full convention.

3. If no catalogued pattern matches and no existing page warrants grouping, propose:
   - A `kebab-case` filename under `<docsPath>/`.
   - A `sidebar_position` value placing the page where it belongs in nav order.

   Confirm both with the user before creating the file.

4. Create the file with the frontmatter schema from `<docsPath>/AGENTS.md`:
   - `title`, `description`, `sidebar_position` are required.

5. Write the content. For non-source-backed pages (external setup, prerequisites, conceptual overviews), use the user's context plus authoritative external documentation. Always link to upstream documentation for steps in third-party systems rather than mirroring them in full. For source-backed pages, follow the read-source step from Branch A before writing.

6. Validate as in Branch A step 7.
