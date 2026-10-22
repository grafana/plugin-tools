---
id: plugin-docs
title: Add documentation to your plugin
description: Write plugin docs in markdown next to your code and publish them on the Documentation tab of the plugin catalog.
keywords:
  - grafana
  - plugins
  - plugin
  - documentation
  - docs
unlisted: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Plugin docs let you write your plugin's documentation in markdown, right next to your code, and ship it with every release. Your users get a **Documentation** tab on your plugin's page in the [Grafana plugin catalog](https://grafana.com/grafana/plugins/), with a sidebar and one page per topic. You write the content, and Grafana handles the styling and hosting.

This guide shows you how to set up plugin docs, preview and validate them and publish them with a release.

:::important

Plugin docs are an experimental feature. Breaking changes might happen without notice, such as renamed commands, changed validation rules or a different file structure.

:::

## Why plugin docs

- **Close to your code.** Docs change in the same pull request as the feature they describe, so reviewers see both together and the two don't drift apart.
- **Simple by design.** Use standard markdown with one file per page, folders for sections and frontmatter for titles and order. There's no build step to set up.
- **No styling to maintain.** Grafana handles the layout, so you don't need CSS, a theme or a site to host.
- **Consistent by default.** Validation checks structure and naming before you publish, and every plugin's docs share the same layout and navigation. Users who know one plugin's docs know where to look in yours.
- **Checked before release.** Validation checks structure, links, images and writing style while you write and again before you publish, so broken pages never reach your users.
- **Agent-friendly.** The scaffold includes instructions for coding agents, so the pages they write follow the conventions and pass validation. An optional script has an agent draft the first version of your pages. Structured, topic-based pages also make your plugin easier for assistants such as Grafana Assistant to find and explain.

## Before you begin

- A plugin scaffolded with [`create-plugin`](../get-started.md).
- [Node.js](https://nodejs.org/) installed.

## Get started

Run this script from the root of your plugin to enable plugin docs:

```bash
npx @grafana/create-plugin@latest add docs
```

The script:

- sets [`docsPath`](../reference/metadata.md) in `src/plugin.json`, which turns on plugin docs
- scaffolds stub pages in a `catalog-docs` folder
- adds `@grafana/plugin-docs-cli` and the `docs:*` scripts to `package.json`
- adds a workflow that validates your docs on pull requests
- updates the `build-plugin` or `package-plugin` action in `release.yml` to a version that builds your docs
- adds instructions for coding agents, described in [Agent support](#agent-support)

To use a different folder, pass `--docsPath`, for example `--docsPath documentation`. When it finishes, the script prints the next steps.

To have an agent write the first version of your pages, refer to [Draft the first version](#draft-the-first-version).

## File structure

The script adds these files, depending on your plugin type:

<Tabs groupId="plugin-type">
<TabItem value="panel" label="Panel">

```text
.
├── catalog-docs/
│   ├── index.md              # landing page of the Documentation tab
│   ├── data-formats.md
│   ├── options.md
│   ├── examples.md
│   ├── troubleshooting.md
│   ├── README.md             # notes for you, not published
│   ├── AGENTS.md             # instructions for coding agents, not published
│   └── CLAUDE.md             # points Claude Code at AGENTS.md
├── .github/workflows/
│   └── validate-docs.yml     # validates docs on pull requests
├── .config/AGENTS/
│   └── instructions.md       # gets a Plugin docs section pointing at catalog-docs/AGENTS.md
└── package.json              # adds @grafana/plugin-docs-cli and the docs:* scripts
```

</TabItem>
<TabItem value="datasource" label="Data source">

```text
.
├── catalog-docs/
│   ├── index.md              # landing page of the Documentation tab
│   ├── configure.md
│   ├── query-editor.md
│   ├── template-variables.md
│   ├── annotations.md        # only when plugin.json has "annotations": true
│   ├── alerting.md           # only when plugin.json has "alerting": true
│   ├── dashboards.md         # only when plugin.json includes a dashboard
│   ├── troubleshooting.md
│   ├── README.md             # notes for you, not published
│   ├── AGENTS.md             # instructions for coding agents, not published
│   └── CLAUDE.md             # points Claude Code at AGENTS.md
├── .github/workflows/
│   └── validate-docs.yml     # validates docs on pull requests
├── .config/AGENTS/
│   └── instructions.md       # gets a Plugin docs section pointing at catalog-docs/AGENTS.md
└── package.json              # adds @grafana/plugin-docs-cli and the docs:* scripts
```

</TabItem>
<TabItem value="app" label="App">

```text
.
├── catalog-docs/
│   ├── index.md              # landing page of the Documentation tab, with setup
│   ├── configure.md          # only when the app has a config page
│   ├── <page>.md             # one for each page of your app, or in features/ for more than three
│   ├── dashboards.md         # only when plugin.json includes a dashboard
│   ├── permissions.md        # only when plugin.json has roles, iam or page roles
│   ├── troubleshooting.md
│   ├── README.md             # notes for you, not published
│   ├── AGENTS.md             # instructions for coding agents, not published
│   └── CLAUDE.md             # points Claude Code at AGENTS.md
├── .github/workflows/
│   └── validate-docs.yml     # validates docs on pull requests
├── .config/AGENTS/
│   └── instructions.md       # gets a Plugin docs section pointing at catalog-docs/AGENTS.md
└── package.json              # adds @grafana/plugin-docs-cli and the docs:* scripts
```

</TabItem>
</Tabs>

## How your docs appear in the catalog

Your plugin's catalog page has four tabs:

| Tab               | Source                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Overview**      | `src/README.md`, or the `README.md` at the root of your repository if there isn't one. |
| **Installation**  | The catalog generates it.                                                              |
| **Changelog**     | The `CHANGELOG.md` at the root of your repository.                                     |
| **Documentation** | Your docs folder. `index.md` is the landing page and the other pages follow it.        |

Don't write installation or changelog pages in your docs folder, because the catalog already provides them.

Your README and your docs serve different readers. The README sells the plugin to someone who hasn't installed it yet: what it does, its main features and a screenshot. The docs help someone who has installed it and needs to get it working.

Don't repeat the README in `index.md`. Use it to orient the reader instead: explain how the docs are organized and link to common tasks.

## Pages

The script creates stub pages that depend on your plugin type. You can add more pages and folders for other features of your plugin.

Some pages are required, and validation fails without them:

- All plugins: an `index.md` at the root, which is the landing page.
- Panel plugins: `options` and `data-formats`, or a folder with the same name.
- Data source plugins: `query-editor` and `configure`, or a folder with the same name.
- App plugins: nothing else.

Use lowercase letters and hyphens in names. When a page grows past about six H2 sections, split it into a folder with its own `index.md`.

### Section briefs and snippets

Each stub page has section briefs, which are HTML comments that say what belongs there. They guide both you and your coding agent. Write the section, then delete the brief.

Some pages include snippets, which are text that is the same for every plugin, between `<!-- snippet:... -->` markers. Grafana keeps them current, so leave snippets as they are or delete a whole snippet when it doesn't apply. Refer to [Snippets](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/snippets.md).

## Decide what to document

Document every feature a user can see or configure. Write task-focused pages that help users get the plugin working: what data it expects, how to configure it and worked examples they can copy. Add troubleshooting for failures users actually hit, with steps to diagnose them.

Leave out anything that isn't specific to your plugin, such as general Grafana concepts. Link to the [Grafana documentation](https://grafana.com/docs/grafana/latest/) instead.

For page shape and conventions, refer to the [Authoring guide](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/authoring.md).

## Write in markdown

Pages use [CommonMark](https://commonmark.org/) plus [GitHub Flavored Markdown](https://github.github.com/gfm/) extensions such as tables, task lists and footnotes. On top of that you get callouts for notes and warnings, collapsible sections, YouTube embeds and short video clips.

There's no MDX and no templating, and the only HTML you can use is for collapsible sections, line breaks and horizontal rules. What you write renders the same way in the catalog, in the local preview and on GitHub.

Every page starts with frontmatter that sets at least `title` and `description`. Use `sidebar_position` to order pages within a folder and `keywords` to add a list of search keywords.

For everything you can write, refer to [Supported markdown](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/supported-markdown.md).

## Add images and videos

Keep images and videos inside your docs folder and reference them with relative paths, for example `![Panel options](img/options.png)`. They ship with the plugin, so they never break when a URL changes.

Use PNG or WebP for screenshots. SVG files aren't allowed, because they can contain scripts. Keep files small, because the whole docs folder ships inside your plugin archive.

For allowed file types and size limits, refer to [Validation rules](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/validation-rules.md).

## Style

Plugin docs follow the [Grafana Writers' Toolkit](https://grafana.com/docs/writers-toolkit/write/style-guide/). Validation flags word-level issues as `style-*` warnings, so fix them as they appear. For the rules it can't check, refer to the [Authoring guide](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/authoring.md#style).

## Agent support

The script scaffolds instructions for coding agents. They explain what to document and how to use `plugin-docs-cli` to validate and preview your docs. With them, your agent of choice can write meaningful, valid docs from short prompts such as "document the new panel option" or "document the new query editor mode".

The instructions live in `AGENTS.md` and `CLAUDE.md` in your docs folder. To make sure agents find them, link to `<docsPath>/AGENTS.md` from the agent files in the root of your plugin.

### Draft the first version

This step is optional. To have an agent write the first version of your pages, commit the changes from `add docs`, then run:

```bash
npx @grafana/create-plugin@latest add docs-content
```

The agent reads your README, your source code and any existing docs, and moves what it finds into the stub pages. The result is a best-effort first draft, so review every change carefully before you commit it.

Run `add docs-content` once, after `add docs`. After that, update pages as part of your normal work.

## Scripts

| Script          | Runs                                         | What it does                                                                  |
| --------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `docs:serve`    | `plugin-docs-cli serve --port 3001 --reload` | Starts a local preview at `http://localhost:3001` that reloads when you save. |
| `docs:validate` | `plugin-docs-cli validate`                   | Checks your docs, the same way the release pipeline does.                     |

Use `docs:serve` while you write. It shows your pages as they'll look in the catalog and reports problems as you save. Run `docs:validate` before you open a pull request.

Validation warns about empty headings and about legacy `section-brief:start` blocks, because the catalog shows their text. Section briefs you leave in a page are only suggestions, because the catalog doesn't show them. Finish with none of these left.

For every check, refer to [Validation rules](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/validation-rules.md).

## Publish your docs

Docs publish as part of a plugin release:

1. `validate-docs.yml` runs `docs:validate` on every pull request that changes your docs folder or `src/plugin.json`. Warnings don't fail it, so you can merge docs in progress.
1. When you release, the plugin validator checks your docs again. Errors fail the release. Warnings don't, so check that `docs:validate` reports none before you release.
1. The release build adds the docs to the plugin archive.
1. When you submit the new version, Grafana reviews the docs as part of the plugin submission.
1. After Grafana approves the version, the docs appear in the catalog.

There are no docs-only releases. To publish a docs change, release a new plugin version. Until then, the catalog keeps showing the docs from your current version.

For the full process, refer to [Publish your plugins](../publish-a-plugin/index.md).

## Keep the docs CLI up to date

The script adds `@grafana/plugin-docs-cli` with a `^` range, such as `^0.8.0`. While the CLI is below version 1.0, that range only takes patch releases, so a new minor version reaches your plugin only when you, Dependabot or Renovate update it.

A new version can add rules or tighten existing ones, so run `docs:validate` after you update and fix anything new before your next release.

## Turn off plugin docs

Remove `docsPath` from `src/plugin.json` and release a new version. The catalog stops showing the **Documentation** tab for that version. You can keep or delete the docs folder, because without `docsPath` the release pipeline ignores it.
