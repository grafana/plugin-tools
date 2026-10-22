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

`configure.md`, the app pages, `dashboards.md` and `permissions.md` exist only when the app has that feature,
as described under [Optional pages](#optional-pages). An app with up to three pages has one file for each at
the root. With more, the pages move into a `features/` folder.

Files may have moved since the plugin was scaffolded, so trace them from `src/module.ts(x)`.
`new AppPlugin()` names the root page component in `setRootPage` and each config page component in
`addConfigPage`. The root page component routes each path in `src/plugin.json` to the component that
renders it. `src/plugin.json` only lists the pages in the app's navigation, so look for tabs and drilldowns
in those components too.

| Page                 | Source of truth                                                                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.md`           | `dependencies` in `src/plugin.json`, the setup sections of the README and `provisioning/`. Update the links when pages are added or removed.                                                                                  |
| `configure.md`       | The components passed to `addConfigPage` and the settings type, including `jsonData` and `secureJsonData`, or the in-app page named Configuration when the app has no `addConfigPage`. With a backend, also how it reads them |
| `features/index.md`  | Nothing - it is a curated router for the pages in `features/`, if the folder exists. Update it when pages are added or removed.                                                                                               |
| App pages            | The component the root page routes the page's path to. Screenshots from `info.screenshots` in `src/plugin.json` whose name matches the page                                                                                   |
| `dashboards.md`      | `includes` entries of type `dashboard` in `src/plugin.json` and their JSON files                                                                                                                                              |
| `permissions.md`     | `roles`, `iam` and the `role` and `action` of each `includes` entry in `src/plugin.json`                                                                                                                                      |
| `troubleshooting.md` | Error and empty-state messages in source, known issues in the README or other docs and reported issues. Never guess failures                                                                                                  |

## Optional pages

Add one of these pages when the app has the matching feature. Use the filename given here, give the page
a `sidebar_position` that puts it where it belongs and link it from `index.md`.

| Trigger                                                                | Page             | Scope                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addConfigPage` in `src/module.ts(x)`                                  | `configure.md`   | Opening the config page, every setting and provisioning the app.                                                                                                                         |
| An app page named Configuration, when there is no `addConfigPage`      | `configure.md`   | What the page is for and how to use it, as for any app page.                                                                                                                             |
| An `includes` entry of type `page` with a path under `/a/{{pluginId}}` | App page         | What the page is for and how to use it. Copy an existing app page, and link it from `index.md`. With a fourth page, move them all into `features/` and list them in `features/index.md`. |
| An `includes` entry of type `dashboard`                                | `dashboards.md`  | What each bundled dashboard shows and how to import it.                                                                                                                                  |
| `roles` or `iam` in `src/plugin.json`                                  | `permissions.md` | What each role grants, default assignments and what the app can access.                                                                                                                  |

An app with a single page names that page after the app, because its navigation label is often a generic one such as Overview or Home. Keep that name when you add a second page only if it still describes the page, and otherwise rename the page after what it shows.

When an app page grows too long, turn it into a folder of the same name with an `index.md` and
split it into pages there. Keep every page within three folder levels of this one.

## What not to write

Never write installation instructions, such as installing the plugin with `grafana-cli`, from a zip file or
in Docker. The Installation tab on the plugin page covers them, and these docs start from a plugin that is
already installed. When the README has an installation section, leave it out of the pages.

## Section briefs

Each section of a scaffolded page has a brief telling you what belongs there. A brief is an HTML comment
that starts with `section-brief`. Search the docs folder for `section-brief` to find what is left to write:

```markdown
## Connect your data

<!-- section-brief
Fill this in: The steps to get the data the app shows into Grafana.

If the app needs no data of its own, remove this section entirely.
-->
```

Some sections also have fixed text, with a brief that builds on it:

```markdown
## Open the configuration page

To open the {{{pluginName}}} configuration page:

1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.

<!-- section-brief
Fill this in: After the list above, add a sentence that names the tab to click.
-->
```

Text outside a brief is written for every app and is part of the scaffold. Keep it, and change it
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

Text between `<!-- snippet:... -->` and `<!-- /snippet:... -->` markers is maintained by Grafana. Never edit inside it - refer to `snippets.md` in the guides.

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
