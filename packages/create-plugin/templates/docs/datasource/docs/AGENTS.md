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

When you change code, update the page that documents it. `annotations.md`, `alerting.md` and `dashboards.md`
exist only when the plugin has that feature, as described under [Optional pages](#optional-pages).

| Page                    | Source of truth                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `index.md`              | Nothing - it is a curated router. Update it when pages are added or removed.                                                              |
| `configure.md`          | The config editor component, the options types in `src/types.ts`, and settings parsing and `CheckHealth` in `pkg/` when there's a backend |
| `query-editor.md`       | The query editor component, the query model in `src/types.ts`, and query handling in `pkg/` or `src/datasource.ts`                        |
| `template-variables.md` | Variable support in `src/datasource.ts`: `variables` or `metricFindQuery`, `applyTemplateVariables`, and `getTagKeys` and `getTagValues`  |
| `annotations.md`        | `annotations` support in `src/datasource.ts`                                                                                              |
| `alerting.md`           | Backend query handling in `pkg/`                                                                                                          |
| `dashboards.md`         | `includes` entries of type `dashboard` in `src/plugin.json` and their JSON files                                                          |
| `troubleshooting.md`    | Error messages in source, health check failures and reported issues. Don't invent failures.                                               |

## Optional pages

Add one of these pages when the plugin has the matching feature. Use the filename given here, give the page
a `sidebar_position` that puts it where it belongs and link it from `index.md`.

| Trigger                                            | Page             | Scope                                                            |
| -------------------------------------------------- | ---------------- | ---------------------------------------------------------------- |
| `"annotations": true` in `src/plugin.json`         | `annotations.md` | Annotation queries, the fields they return and examples.         |
| `"alerting": true` in `src/plugin.json`            | `alerting.md`    | Which queries work in alert rules, creating a rule and examples. |
| An `includes` entry of type `dashboard`            | `dashboards.md`  | What each bundled dashboard shows and how to import it.          |
| Macros that outgrow a section of `query-editor.md` | `macros.md`      | Every macro with its syntax, what it expands to and an example.  |
| RBAC role declarations in `src/plugin.json`        | `permissions.md` | What each role grants, default assignments.                      |

## Section briefs

Each section of a scaffolded page has a brief telling you what belongs there. A brief is an HTML comment
that starts with `section-brief`. Search the docs folder for `section-brief` to find what is left to write:

```markdown
## Macros

<!-- section-brief
Fill this in: A table of every macro the plugin expands in queries.

If the plugin has no macros, remove this section entirely.
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
it reports no warnings. In particular, an `empty-section` or `unfilled-section-brief` warning means a section
is still unwritten or a brief is still in place. These warnings don't fail validation, so a passing exit
code alone does not mean the docs are done.

## Preview

```bash
{{packageManagerName}} run docs:serve    # local preview at http://localhost:3001, reloads on save
```

`docs:serve` keeps running until you stop it. Start it in the background if you need to look at the
rendered pages, and stop it when you are done.
