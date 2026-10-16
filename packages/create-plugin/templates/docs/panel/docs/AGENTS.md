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
| `troubleshooting.md` | Error and empty-state messages in source, and reported issues. Don't invent failures.  |

## Optional pages

Add one of these pages when the plugin has the matching feature. Use the filename given here, give the page
a `sidebar_position` that puts it where it belongs and link it from `index.md`.

| Trigger                                                                            | Page               | Scope                                                        |
| ---------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `setPresetsSupplier(...)` in source                                                | `presets.md`       | The presets the panel ships, when each applies, screenshots. |
| RBAC role declarations in `src/plugin.json`                                        | `permissions.md`   | What each role grants, default assignments.                  |
| Substantial accessibility considerations (keyboard shortcuts, screen reader notes) | `accessibility.md` | Keyboard interaction, ARIA, contrast, motion preferences.    |

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

The first paragraph, after `Fill this in:`, is the instruction. A paragraph after it is extra context.

To fill a section:

1. Read the brief. It covers only the section it sits under.
2. Read the source the page documents, from the table above, then write the section.
3. Delete the whole comment, from `<!-- section-brief` to `-->`, including any extra paragraphs inside it.

Briefs are not shown in the preview or the catalog, so a section you haven't written looks like a bare
heading. `docs:validate` lists every section that still has only its brief.

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
