# Plugin docs

This folder is the documentation for **{{pluginName}}**, published at
`grafana.com/grafana/plugins/{{pluginId}}/docs/`.

## Guides

Read these before you write or change any page. This docs format is new and your training
data does not cover it, so do not rely on what you know about other docs tools.

Start with `node_modules/@grafana/plugin-docs-cli/docs/index.md`, which says which guide to read for what.
The guides match the version of the validator this plugin uses. In a monorepo the package may be in a
parent `node_modules` - `{{packageManagerName}} run docs:validate` prints the exact path to the guides'
`README.md`, and the other guides sit next to it.

The guides show `npm run` in their examples. This plugin uses **{{packageManagerName}}**, so run the
commands below instead.

## Pages and their source

When you change code, update the page that documents it:

| Page                 | Source of truth                                                                        |
| -------------------- | -------------------------------------------------------------------------------------- |
| `index.md`           | Nothing - it is a curated router. Update it when pages are added or removed.           |
| `options.md`         | `setPanelOptions` and `useFieldConfig` in `src/module.ts`                              |
| `data-formats.md`    | The panel component's data handling, plus any field pickers in `src/module.ts`         |
| `examples.md`        | `provisioning/dashboards/*.json` if present, otherwise the panel's own option defaults |
| `troubleshooting.md` | Real reported failures. Don't invent failure modes.                                    |

## Section briefs

Each section of a scaffolded page has a brief telling you what belongs there:

```markdown
## Options

<!-- section-brief:start -->

> 📝 **Fill this in:** Describe every option the plugin registers, one row per option.

If the plugin has no options, remove this section entirely.

<!-- section-brief:end -->
```

Only the main instruction has the `> 📝 **Fill this in:**` prefix. A paragraph after it is extra context.

To fill a section:

1. Read the brief. It covers only the section it sits under.
2. Read the source the page documents, from the table above, then write the section.
3. Delete the whole brief, from `<!-- section-brief:start -->` to `<!-- section-brief:end -->`, including
   the blockquote and any extra paragraphs inside it.

## Validate

```bash
{{packageManagerName}} run docs:validate          # while writing; unfilled section briefs are notes
{{packageManagerName}} run docs:validate:release  # before finishing; unfilled section briefs are errors
```

Run `docs:validate` after every page you write or change and fix what it reports. When you finish a docs
task, run `docs:validate:release` too - a pass from `docs:validate` alone does not mean the docs are done.

## Preview

```bash
{{packageManagerName}} run docs:serve    # local preview at http://localhost:3001, reloads on save
```

`docs:serve` keeps running until you stop it. Start it in the background if you need to look at the
rendered pages, and stop it when you are done.
