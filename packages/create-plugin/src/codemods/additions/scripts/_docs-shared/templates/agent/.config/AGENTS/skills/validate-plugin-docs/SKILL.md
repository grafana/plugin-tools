---
name: validate-plugin-docs
description: Runs `npm run docs:validate --json` and applies category-based auto-fixes to plugin docs files, iterating up to 3 times. Use after authoring or editing docs to clean up structural validation errors before pushing.
---

# Validate Plugin Docs

> **Path conventions:** Throughout this skill, `<docsPath>/` refers to the docs folder configured in `src/plugin.json` via the `docsPath` field (default: `docs`). Read that value before following any step that touches a path inside the docs folder.

## Usage

```
/validate-plugin-docs
```

Run from the plugin root. Loops validate → fix → validate until clean or stuck.

## Steps

1. Run the validator with JSON output:

   ```bash
   npm run docs:validate -- --json
   ```

   The output is a single JSON document of shape:

   ```json
   {
     "valid": false,
     "diagnostics": [
       {
         "severity": "error",
         "rule": "frontmatter-required-fields",
         "file": "<docsPath>/x.md",
         "message": "...",
         "line": 3
       }
     ]
   }
   ```

2. If `valid` is `true`, report success and exit.

3. Group diagnostics by `rule`. Apply fixes per category:

   | Rule category                                                    | Fix the agent attempts                                                                                                               |
   | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
   | `frontmatter-*`                                                  | Add missing required field, correct type, remove unknown field. Required fields are `title`, `description`, `sidebar_position`.      |
   | `has-markdown-files` / `*-index` / `*-naming`                    | Create missing required page from the same scaffold conventions used by `create-plugin add datasource-docs`. Rename misplaced files. |
   | `no-spaces-in-names` / `valid-file-naming`                       | Rename to kebab-case.                                                                                                                |
   | `no-raw-html` / `no-script-tags`                                 | Remove offending HTML except the `<!-- section-brief -->` blocks (which the parser ignores).                                         |
   | `image-refs-relative` / `internal-links-relative`                | Fix path.                                                                                                                            |
   | `internal-links-resolve`                                         | Suggest closest existing page; ask the user before changing semantics.                                                               |
   | `referenced-images-exist` / `no-orphaned-images`                 | Flag for the user. Do not generate images. Do not delete referenced images.                                                          |
   | `max-image-size` / `max-total-images-size` / `max-data-uri-size` | Flag for the user. Suggest re-encoding to PNG or splitting into multiple pages. Do not auto-resize.                                  |
   | `manifest-*`                                                     | Manifest is auto-generated downstream. Surface as a bug; do not patch.                                                               |

4. After applying a round of fixes, re-run `npm run docs:validate -- --json`.

5. Repeat steps 2-4 up to **3 iterations total**. If validation is still failing after 3 rounds, stop and report:
   - Which diagnostics remain unfixed.
   - Why the heuristic could not fix them.
   - What the user should do next.

6. When clean, run a final sanity check:
   ```bash
   npm run docs:validate
   ```
   This runs in strict mode; the exit code is what CI checks. A zero exit here means the docs ship.
