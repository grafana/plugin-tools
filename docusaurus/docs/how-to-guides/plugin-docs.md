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

Plugin docs let you write your plugin's documentation in markdown, right next to your code, and ship it with every release. Your users get a Documentation tab on your plugin's page in the [Grafana plugin catalog](https://grafana.com/grafana/plugins/), with a sidebar and one page per topic. You write the content, and Grafana handles the styling and hosting.

This guide shows you how to set up plugin docs, preview and validate them and publish them with a release.

## Why plugin docs

- **Close to your code.** Docs change in the same pull request as the feature they describe, so reviewers see both together and the two don't drift apart.
- **Plain markdown.** One file per page, folders for sections and frontmatter for titles and order. There's no build step to set up.
- **No styling to maintain.** Grafana handles the layout, so you don't need CSS, a theme or a site to host.
- **Consistent navigation.** Every plugin's docs share the same layout, so users who know one plugin's docs know where to look in yours.
- **Checked before release.** Validation checks structure, links, images and writing style while you write and again before you publish, so broken pages never reach your users.
- **Agent-friendly.** The scaffold includes instructions and a skill for coding agents, so the pages they write follow the conventions and pass validation. Structured, topic-based pages also make your plugin easier for assistants such as Grafana Assistant to find and explain.

## Before you begin

- A plugin scaffolded with [`create-plugin`](../get-started.md).
- [Node.js](https://nodejs.org/) installed.

:::note

The `add docs` codemod only supports panel plugins so far.

:::

## Get started

Run the codemod from the root of your plugin:

```bash
npx @grafana/create-plugin@latest add docs
```

The codemod:

- sets [`docsPath`](../reference/metadata.md) in `src/plugin.json`, which turns on plugin docs
- scaffolds stub pages in a `docs` folder
- adds `@grafana/plugin-docs-cli` and the `docs:*` scripts to `package.json`
- adds a workflow that validates your docs on pull requests
- updates the `build-plugin` or `package-plugin` action in `release.yml` to a version that builds your docs
- adds instructions and a skill for [coding agents](#work-with-coding-agents)

To use a different folder, pass `--docsPath`, for example `--docsPath documentation`. When it finishes, the codemod prints the next steps.

## File structure

For a panel plugin, the codemod adds:

```text
.
├── docs/
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
├── .agents/skills/bootstrap-plugin-docs/   # also in .claude/ and .codex/
├── .config/AGENTS/
│   └── instructions.md       # gets a Documentation section pointing at docs/AGENTS.md
└── package.json              # adds @grafana/plugin-docs-cli and the docs:* scripts
```

If your plugin doesn't have them yet, the codemod also creates `.config/AGENTS/instructions.md` and the `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` files in the root of your plugin that point agents at it.

Each stub page has section notes that say what belongs there. Replace each note with your content, and delete the note when you're done. You can rename, add or remove pages, because the scaffold is a starting point and not a fixed structure.

## Scripts

| Script          | Runs                                         | What it does                                                                  |
| --------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `docs:serve`    | `plugin-docs-cli serve --port 3001 --reload` | Starts a local preview at `http://localhost:3001` that reloads when you save. |
| `docs:validate` | `plugin-docs-cli validate`                   | Checks your docs, the same way the release pipeline does.                     |

Use `docs:serve` while you write. It shows your pages as they'll look in the catalog and reports problems as you save. Run `docs:validate` before you open a pull request.

Unwritten sections and leftover section notes are reported as warnings. Since warnings don't fail the check and allow pages to be published as they are, finish with none left.

For every check, refer to [Validation rules](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/validation-rules.md).

## How your docs appear in the catalog

Your plugin's catalog page has four tabs:

| Tab           | Source                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| Overview      | The `README.md` at the root of your repository.                              |
| Installation  | Generated by the catalog.                                                    |
| Changelog     | The `CHANGELOG.md` at the root of your repository.                           |
| Documentation | Your docs folder. `index.md` is the landing page, the other pages follow it. |

Don't write installation or changelog pages in your docs folder, because the catalog already provides them.

Your README and your docs serve different readers. The README sells the plugin to someone who hasn't installed it yet: what it does, its main features and a screenshot. The docs help someone who has installed it and needs to get it working.

Don't repeat the README in `index.md`. Use it to orient the reader instead: explain how the docs are organized and link to common tasks.

## Decide what to document

Document every feature a user can see or configure. Write task-focused pages that help users get the plugin working: what data it expects, how to configure it and worked examples they can copy. Add troubleshooting for failures users actually hit, with steps to diagnose them.

Leave out anything that isn't specific to your plugin, such as general Grafana concepts. Link to the [Grafana documentation](https://grafana.com/docs/grafana/latest/) instead.

For page shape and conventions, refer to the [Authoring guide](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/authoring.md).

## Write in markdown

Pages use [CommonMark](https://commonmark.org/) plus [GitHub Flavored Markdown](https://github.github.com/gfm/) extensions such as tables, task lists and footnotes. On top of that you get callouts for notes and warnings, collapsible sections, YouTube embeds and short video clips.

There's no MDX and no templating, and the only HTML you can use is for collapsible sections, line breaks and horizontal rules. What you write renders the same way in the catalog, in the local preview and on GitHub.

Every page starts with frontmatter that sets at least `title` and `description`. Use `sidebar_position` to order pages within a folder.

For everything you can write, refer to [Supported markdown](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/supported-markdown.md).

## Add images and videos

Keep images and videos inside your docs folder and reference them with relative paths, for example `![Panel options](img/options.png)`. They ship with the plugin, so they never break when a URL changes.

Use PNG or WebP for screenshots. SVG files aren't allowed, because they can contain scripts. Keep files small, because the whole docs folder ships inside your plugin archive.

For allowed file types and size limits, refer to [Validation rules](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/validation-rules.md).

## Work with coding agents

The codemod scaffolds instructions for coding agents:

- `AGENTS.md` and `CLAUDE.md` in your docs folder send the agent to the guides in `node_modules/@grafana/plugin-docs-cli/docs/` whenever it works on your docs. They also list the validate and preview commands for your package manager.
- `.config/AGENTS/instructions.md` gets a Documentation section that tells the agent to update the docs whenever it adds, removes or changes a feature. That keeps docs current during everyday work, not just when you ask for it. If your plugin has its own `AGENTS.md` or `CLAUDE.md` that doesn't point at this file, the codemod tells you to add a reference.
- The `bootstrap-plugin-docs` skill drafts the stub pages from your source code and README, and asks you about anything the source can't answer. Run it once after scaffolding with `/bootstrap-plugin-docs`.

After the first draft, editing docs is ordinary work. Ask your agent to change a feature and it updates the matching page in the same change.

The agent files don't affect your docs or how they're published. If you don't use a coding agent, you can delete the ones the codemod added.

## Publish your docs

Docs publish as part of a plugin release:

1. `validate-docs.yml` runs `docs:validate` on every pull request that changes your docs folder or `src/plugin.json`. Warnings don't fail it, so you can merge docs in progress.
1. When you release, the plugin validator checks your docs again. Errors fail the release. Warnings don't, so check that `docs:validate` reports none before you release.
1. The docs are built into the plugin archive.
1. When you submit the new version, Grafana reviews the docs as part of the plugin submission.
1. Once the version is approved, the docs appear in the catalog.

There are no docs-only releases. To publish a docs change, release a new plugin version. Until then, the catalog keeps showing the docs from your current version.

## Keep the docs CLI up to date

The codemod pins `@grafana/plugin-docs-cli` to an exact version, so validation results don't change unless you choose to update. Dependabot or Renovate can bump it like any other dependency.

A new version can add rules or tighten existing ones, so run `docs:validate` after you update and fix anything new before your next release.

## Turn off plugin docs

Remove `docsPath` from `src/plugin.json` and release a new version. The catalog stops showing the Documentation tab for that version. You can keep or delete the docs folder, because without `docsPath` the release pipeline ignores it.
