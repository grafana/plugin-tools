# Plugin docs

This folder is the documentation for **{{{pluginName}}}**, published at
`grafana.com/grafana/plugins/{{pluginId}}/docs/`.

## Guides

Read these before you write or change any page. This docs format is new and your training
data does not cover it, so do not rely on what you know about other docs tools.

Run `{{packageManagerName}} run docs:validate` and open the guide on its last line, `Docs guides:`. It's
the guides' `index.md`, which says which guide to read for what, and the other guides sit next to it.
The guides match the version of the validator this plugin uses. The line is a local path, usually
`node_modules/@grafana/plugin-docs-cli/docs/index.md`, or a URL when the package isn't on disk, such as
with Yarn Plug'n'Play.

The guides name scripts such as `docs:validate`. This plugin uses **{{packageManagerName}}**, so run them
with `{{packageManagerName}} run`, as in the commands below.

## Pages and their source

When you change code, update the page that documents it:

| Page                 | Source of truth                                                                        |
| -------------------- | -------------------------------------------------------------------------------------- |
| `index.md`           | Nothing - it is a curated router. Update it when pages are added or removed.           |
| `options.md`         | `setPanelOptions` and `useFieldConfig` in `src/module.ts`                              |
| `data-formats.md`    | The panel component's data handling, plus any field pickers in `src/module.ts`         |
| `examples.md`        | `provisioning/dashboards/*.json` if present, otherwise the panel's own option defaults |
| `troubleshooting.md` | Error and empty-state messages in source, known and reported issues. Never guess.      |

Never guess failures in `troubleshooting.md`. Each symptom must come from an error, warning or empty-state
message in source, a known issue in the README or other docs or a reported issue.

## Optional pages

Add one of these pages when the plugin has the matching feature. Use the filename given here, give the page
a `sidebar_position` that puts it where it belongs and link it from `index.md`.

| Trigger                                                                            | Page               | Scope                                                        |
| ---------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `setPresetsSupplier(...)` in source                                                | `presets.md`       | The presets the panel ships, when each applies, screenshots. |
| RBAC role declarations in `src/plugin.json`                                        | `permissions.md`   | What each role grants, default assignments.                  |
| Substantial accessibility considerations (keyboard shortcuts, screen reader notes) | `accessibility.md` | Keyboard interaction, ARIA, contrast, motion preferences.    |

## What not to write

Never write installation instructions, such as installing the plugin with `grafana-cli`, from a zip file or
in Docker. The Installation tab on the plugin page covers them, and these docs start from a plugin that is
already installed. When the README has an installation section, leave it out of the pages.

## Section briefs

Each section of a scaffolded page has a brief telling you what belongs there. A brief is an HTML comment
that starts with `section-brief`. Search the docs folder for `section-brief` to find what is left to write:

```markdown
## Options

<!-- section-brief
Fill this in: Describe every option the plugin registers, one row per option.

If the plugin has no options, remove this section entirely.
-->
```

Some sections also have fixed text, with a brief that builds on it:

```markdown
## Basic example

A panel excerpt in dashboard JSON has this shape:

<!-- section-brief
Fill this in: Complete the excerpt above with the options the example needs.
-->
```

Text outside a brief is written for every panel and is part of the scaffold. Keep it, and change it
only where it's wrong for this plugin, such as a menu path or a step that differs.

Everything inside a brief is the instruction. A brief covers the section it sits under, unless it says
otherwise: it may tell you to extend the fixed text above it, to replace it with several sections or to
remove the page. When a brief says to remove a section, remove its heading and fixed text too.

To fill a section:

1. Read the brief.
2. Read the source the page documents, from the table above, then write the section.
3. Delete the whole comment, from `<!-- section-brief` to `-->`.

Briefs are not shown in the preview or the catalog, so a section you haven't written looks like a bare
heading. `docs:validate` lists every section that still has only its brief.

## Snippets

Some sections contain a snippet: text that is the same for every plugin, between two markers.

```markdown
<!-- snippet:use-example-json -->

To use an example, open your dashboard and go to **Dashboard settings** > **JSON Model**. Paste the excerpt into the `panels` array and click **Save changes**.

<!-- /snippet:use-example-json -->
```

Grafana keeps the text inside a snippet up to date, and grafana.com shows its current version instead of the text in the file. Never edit inside a snippet, because the change doesn't show. When a snippet is wrong for this plugin, delete the whole snippet, both markers included. Write plugin-specific text before or after it, and don't continue its list. The snippets guide next to the other guides has the rules.

## Validate

```bash
{{packageManagerName}} run docs:validate
```

Run `docs:validate` after every page you write or change and fix what it reports. A docs task is done when
it reports no warnings and no suggestions about section briefs. In particular, an `empty-section` or
`unfilled-section-brief` suggestion means a section is still unwritten or a brief is still in place. Neither
fails validation, so a passing exit code alone does not mean the docs are done.

## Preview

```bash
{{packageManagerName}} run docs:serve    # local preview at http://localhost:3001, reloads on save
```

`docs:serve` keeps running until you stop it. Start it in the background if you need to look at the
rendered pages, and stop it when you are done.
