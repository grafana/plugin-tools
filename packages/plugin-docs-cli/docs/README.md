# Plugin docs guides

Write your plugin's documentation in markdown, right next to your code, and it ships with every release. Your users get a Documentation tab on your plugin's page in the [Grafana plugin catalog](https://grafana.com/grafana/plugins/), with a sidebar and one page per topic. You focus on the content - Grafana handles the styling and hosting.

These guides ship with `@grafana/plugin-docs-cli`, so they always match the version you have installed.

## Why plugin docs

- **Close to your code.** Docs live in your plugin repository and change in the same pull request as the feature they describe. Reviewers see the code and the docs together, so the two don't drift apart.
- **Simple to write.** Plain markdown with a Docusaurus-like folder structure: one file per page, folders for sections and frontmatter for titles and order. You also get callouts, collapsible sections, videos, tables and code blocks, with no build step to set up.
- **Focus on content.** Grafana handles the styling, so you only write the words. No CSS, no theme and no site to host.
- **Consistent with other plugins.** Every plugin's docs share the same layout and navigation, so users who know one plugin's docs know where to look in yours.
- **Better quality.** Validation checks structure, links, images and writing style while you write and again before you publish. Broken pages never reach your users.
- **AI-assisted authoring.** The scaffold ships with agent instructions and skills that simplify writing your docs. Your coding agent follows these guides, so its pages follow the conventions and pass validation.
- **Discoverable by agents.** Structured, topic-based pages make your plugin easier for assistants such as Grafana Assistant and GCX to find and explain.

## Get started

Run the codemod from the root of your plugin:

```bash
npx @grafana/create-plugin@latest add docs
```

The codemod:

- sets `docsPath` in `src/plugin.json`, which turns on plugin docs
- scaffolds stub pages in a `docs` folder
- adds `@grafana/plugin-docs-cli` and the `docs:*` scripts to `package.json`
- adds a workflow that validates your docs on pull requests
- updates the `build-plugin` action in `release.yml` to a version that builds your docs

To use a different folder, pass `--docsPath`, for example `--docsPath documentation`. Only panel plugins are supported so far.

Already have docs on the docs website? Follow [Migrate from the docs website](./migrate-from-docs-website.md) instead. If `docs/` holds the docs website sources, pass `--docsPath` to put plugin docs in another folder.

When it finishes, the codemod prints the next steps.

## File structure

For a panel plugin, the codemod adds:

```
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
└── package.json              # adds @grafana/plugin-docs-cli and the docs:* scripts
```

Each stub page has section notes that say what belongs there. Replace each note with your content, and delete the note when you're done. You can rename, add or remove pages - the scaffold is a starting point, not a fixed structure.

## Scripts

| Script                  | Runs                                                       | What it does                                                                    |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `docs:serve`            | `plugin-docs-cli serve --port 3001 --reload`               | Starts a local preview at `http://localhost:3001` that reloads when you save.   |
| `docs:validate`         | `plugin-docs-cli validate --strict --allow-unfilled-stubs` | Checks your docs. Unfilled section notes are reported but don't fail the check. |
| `docs:validate:release` | `plugin-docs-cli validate --strict`                        | Runs the same check as the release pipeline. Unfilled section notes are errors. |

Use `docs:serve` while you write. It shows your pages as they'll look in the catalog and reports problems as you save. Run `docs:validate` before you open a pull request, and `docs:validate:release` before you cut a release.

For every check, refer to [Validation rules](./validation-rules.md).

## How your docs appear in the catalog

Your plugin's catalog page has four tabs:

| Tab           | Source                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| Overview      | The `README.md` at the root of your repository.                              |
| Installation  | Generated by the catalog.                                                    |
| Changelog     | The `CHANGELOG.md` at the root of your repository.                           |
| Documentation | Your docs folder. `index.md` is the landing page, the other pages follow it. |

Don't write installation or changelog pages in your docs folder - the catalog already provides them.

Your README and your docs serve different readers. The README sells the plugin to someone who hasn't installed it yet: what it does, its main features and a screenshot. The docs help someone who has installed it and needs to get it working.

Don't repeat the README in `index.md`. Use it to orient the reader instead: explain how the docs are organized and link to common tasks.

## What to document

Document every feature a user can see or configure. Write task-focused pages that help users get the plugin working: what data it expects, how to configure it and worked examples they can copy. Add troubleshooting for failures users actually hit, with steps to diagnose them.

Leave out anything that isn't specific to your plugin, such as general Grafana concepts. Link to the [Grafana documentation](https://grafana.com/docs/grafana/latest/) instead.

For page shape and conventions, refer to the [Authoring guide](./authoring.md).

## Markdown

Pages use [CommonMark](https://commonmark.org/) plus [GitHub Flavored Markdown](https://github.github.com/gfm/) extensions such as tables, task lists and footnotes. On top of that you get callouts for notes and warnings, collapsible sections, YouTube embeds and short video clips.

There is no MDX and no templating, and the only HTML you can use is for collapsible sections, line breaks and horizontal rules. What you write renders the same way in the catalog, in the local preview and on GitHub.

Every page starts with frontmatter that sets at least `title` and `description`. Use `sidebar_position` to order pages within a folder.

For everything you can write, refer to [Supported markdown](./supported-markdown.md).

## Images and other assets

Keep images and videos inside your docs folder and reference them with relative paths, for example `![Panel options](img/options.png)`. They ship with the plugin, so they never break when a URL changes.

Use PNG or WebP for screenshots. SVG files aren't allowed, because they can contain scripts. Keep files small - the whole docs folder ships inside your plugin archive.

For allowed file types and size limits, refer to [Validation rules](./validation-rules.md).

## Work with coding agents

The codemod scaffolds instructions for coding agents:

- `AGENTS.md` and `CLAUDE.md` in your docs folder send the agent to these guides whenever it works on your docs. They also list the validate and preview commands for your package manager.
- `.config/AGENTS/instructions.md` gets a line that tells the agent to update the docs when it changes `src/`. That keeps docs current during everyday work, not just when you ask for it.
- The `bootstrap-plugin-docs` skill drafts the stub pages from your source code and README, and asks you about anything the source can't answer. Run it once after scaffolding with `/bootstrap-plugin-docs`.

After the first draft, editing docs is ordinary work. Ask your agent to change a feature and it updates the matching page in the same change.

## Publish your docs

Docs publish as part of a plugin release:

1. `validate-docs.yml` runs `docs:validate` on every pull request that changes your docs folder or `src/plugin.json`. Unfilled section notes don't fail it, so you can merge docs in progress.
1. When you release, the plugin validator checks your docs again. Errors, including unfilled section notes, fail the release.
1. The docs are built into the plugin archive.
1. When you submit the new version, Grafana reviews the docs as part of the plugin submission.
1. Once the version is approved, the docs appear in the catalog.

There are no docs-only releases. To publish a docs change, release a new plugin version. Until then, the catalog keeps showing the docs from your current version.

## Keep the docs CLI up to date

The codemod pins `@grafana/plugin-docs-cli` to an exact version, so validation results don't change unless you choose to update. Dependabot or Renovate can bump it like any other dependency.

A new version can add rules or tighten existing ones, so run `docs:validate` after you update and fix anything new before your next release.

## Turn off plugin docs

Remove `docsPath` from `src/plugin.json` and release a new version. The catalog stops showing the Documentation tab for that version. You can keep or delete the docs folder - without `docsPath`, the release pipeline ignores it.
