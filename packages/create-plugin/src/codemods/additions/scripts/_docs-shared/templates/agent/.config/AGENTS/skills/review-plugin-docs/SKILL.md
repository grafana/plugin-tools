---
name: review-plugin-docs
description: Plugin-specific review of docs files against frontmatter requirements, agent-hint cleanup, style rules, and factual alignment with source files. Reports findings without auto-editing. Use before merging changes that touch docs/**.
---

# Review Plugin Docs

> **Path conventions:** Throughout this skill, `<docsPath>/` refers to the docs folder configured in `src/plugin.json` via the `docsPath` field (default: `docs`). Read that value before following any step that touches a path inside the docs folder.

## Usage

```
/review-plugin-docs [page-path]
```

Run from the plugin root. Without a page path, reviews every doc page changed in the current git diff. With a page path, reviews just that file.

This skill is plugin-specific and intentionally narrow. For a heavyweight pass (link validation, Vale style linting, multi-agent technical review) use a dedicated docs review tool.

## Steps

1. Determine the target file set:

   ```bash
   if [ -n "$TARGET" ]; then
     FILES="$TARGET"
   else
     FILES=$(git diff --name-only HEAD <docsPath>/ 2>/dev/null | grep '\.md$')
     if [ -z "$FILES" ]; then
       FILES=$(git diff --name-only --cached <docsPath>/ 2>/dev/null | grep '\.md$')
     fi
   fi
   ```

   If still empty, ask the user which page to review.

2. Read `<docsPath>/AGENTS.md` for the style rules and frontmatter schema. Keep them in context for the rest of the review.

3. For each target file:

   **Frontmatter checks:**
   - `title`, `description`, `sidebar_position` are all present.
   - `description` is a single concise sentence (not a paragraph).

   **Agent-hint cleanup:**
   - No `<!-- agent-hint:start -->` or `<!-- agent-hint:end -->` markers remain. If any are found, flag them and propose stripping them.

   **Style rule check** (against the 13 rules in `<docsPath>/AGENTS.md`):
   - Present tense, not future "will".
   - Active voice.
   - Second person "you", not first person "we/our".
   - No filler adjectives (easy, simple, just, obviously).
   - No exclamation marks in body text.
   - Bold for UI elements; code formatting for commands/paths/values.
   - Descriptive link text.
   - "refer to" not "see" for links.
   - Sentence case in headings.
   - No `--` (double hyphens) - use `-` or `—`.

   **Factual alignment:**
   - For each documented field, type or behaviour, locate it in `src/` via grep or path inspection. The page title and section hints suggest where to look (the bootstrap-plugin-docs skill's page catalog lists conventional source-to-page mappings for the plugin type). Flag anything invented.

   **Forbidden content:**
   - No MDX or React components.
   - No references to one-click installation.
   - No internal-only URLs (anything on `*.grafana-ops.net`, `*.staging.*` etc.).
   - No invented example data unless clearly labelled as illustrative.

4. Report findings in this format, grouped by file:

   ```
   [<docsPath>/configuration.md]
   - Line 12: STYLE - "users will see" should be "users see" (present tense).
   - Line 34: FACTUAL - documented field `region` not found in src/components/ConfigEditor.tsx. Verify or remove.
   - Line 88: HINT - leftover agent-hint block. Strip lines 86-90.
   ```

5. Do not auto-edit. Surface every finding in chat. If the user says "apply them", proceed page by page. After applying, run `npm run docs:validate -- --json` and report any remaining issues.
