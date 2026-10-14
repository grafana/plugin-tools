# Authoring guide

How to write and maintain the docs for a Grafana plugin. It is written for whoever does the
work - a human author or an AI agent - and it ships with `@grafana/plugin-docs-cli`, so it always
matches the version of `validate` you have installed.

Your docs folder is whatever `docsPath` in `src/plugin.json` points at, usually `docs/`. The pages are
published to `grafana.com/grafana/plugins/<slug>/docs/<page>`.

## Keep docs in sync with source

Whenever you add, change or remove a feature in `src/`, update the matching pages in the same change:

- **Added a feature** - extend the relevant page, for example a new option or a new supported field type.
- **Changed a feature** - update the text and any tables so they match the current behavior.
- **Removed a feature** - delete the section or page and fix any links that pointed to it.

This is routine work, not a special workflow. Edit the page, follow the conventions below, then run
validation.

## Add a page

If the plugin has the `bootstrap-plugin-docs` skill, its page catalog lists the conventional filenames
for optional pages. Use the name from there. Otherwise pick a `kebab-case` filename and a
`sidebar_position` that puts the page where it belongs. Link the new page from `index.md` so readers can
reach it.

## Page shape

Every page is a Markdown file with a frontmatter block. `title` and `description` are required; `sidebar_position` is optional and controls order within a folder.

```yaml
---
title: Configuration
description: Learn how to configure the panel's axis and legend options.
sidebar_position: 2
---
```

Nested folders become nested URLs, so `<docsPath>/options/legend.md` is served at
`.../docs/options/legend`. For everything you can write in a page, refer to
[Supported markdown](./supported-markdown.md).

Validation enforces the rest: filenames, frontmatter fields and lengths, image formats and sizes, link
resolution and which Markdown is allowed. Don't try to remember those rules. Write the page, run
validation and fix what it reports. The full list is in [Validation rules](./validation-rules.md).

### Group closely coupled pages into folders

Start flat. When a page outgrows itself - more than about six H2 sections, or a topic with several
independent parts - split it into a folder rather than letting it sprawl:

```
docs/options/index.md      # overview, shared context, links to children
docs/options/tooltip.md    # tooltip options
docs/options/legend.md     # legend options
```

Rather than:

```
docs/options.md
docs/tooltip.md      # less discoverable, scope unclear
docs/legend.md
```

The folder's `index.md` is the parent page. It carries the overview and links to the children. Each
child gets its own `sidebar_position` to set its order within the folder.

## Section briefs

Pages scaffolded by `create-plugin` contain section briefs, which tell you what belongs in each section. A
brief is an HTML comment that starts with `section-brief`:

```markdown
## Options

<!-- section-brief
Describe every option the plugin registers, one row per option.
-->
```

Briefs aren't shown in the catalog or the preview. Write the section, then delete the whole comment.

Validation warns about a section that only has its brief, and about a brief left in a section that has
content. It also warns about any heading with no content before the next heading, so write the section or
remove the heading. A heading followed directly by a deeper heading is fine. Finish with none of these
warnings left.

Pages scaffolded by an earlier version use `<!-- section-brief:start -->` and `<!-- section-brief:end -->`
markers instead, with visible text between them. Validation warns about these too, but their text is shown
in the catalog, so delete the whole block, markers included.

## Style

These pages follow the [Grafana Writers' Toolkit](https://grafana.com/docs/writers-toolkit/).
Validation flags word-level issues as `style-*` warnings, such as "see" instead of "refer to" or
"simply". Fix those as they appear. It can't check these, so they are on you:

1. **Active voice.** Not "the request is processed by the server" - "the server processes the request".
2. **Second person.** Address the reader as "you", not "we" or "our".
3. **Bold for UI elements.** "Click **Save & test**." Not italics, not code formatting.
4. **Code formatting for commands, paths and values.** "Set `region` to `us-east-1`."
5. **Descriptive link text.** Never "click here", "this link" or a bare filename. Use the target page's
   title, so the text still makes sense out of context.
6. **Sentence case for headings.** "Before you begin", not "Before You Begin". Product names keep their
   own capitalization.

## Don't

Validation can't catch these, so they are on you:

- Don't invent query fields, options or behavior. On a page backed by source code, document only what
  you can see in the source.
- Don't generate images. Flag missing images for the author to add.
- Don't mention one-click installation. It has been removed from the plugin catalog.
- Don't link to internal-only URLs, anything on `*.grafana-ops.net` or a staging environment.

## Validate

Run `docs:validate` after every page you write or change and fix what it reports. You are done when it
reports no warnings. A section you haven't written and a `section-brief` comment left in place are both
warnings, and warnings don't fail the command, so a passing exit code alone doesn't mean the docs are done.

For the commands, refer to [Scripts](https://grafana.com/developers/plugin-tools/how-to-guides/plugin-docs#scripts).
