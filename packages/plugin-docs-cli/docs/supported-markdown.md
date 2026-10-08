# Supported markdown

To write Plugin docs use plain markdown: [CommonMark](https://commonmark.org/) plus the
[GitHub Flavored Markdown](https://github.github.com/gfm/) extensions. There is no MDX, no
templating and no raw HTML. What you write is what gets rendered on grafana.com, in the `serve`
preview and on GitHub, so your docs read well in all three platforms.

This page lists everything you can use and how to write it. For the checks that run against your
docs folder, refer to [Validation rules](./validation-rules.md).

## Pages and frontmatter

Each `.md` file in your docs folder is one page. The folder structure becomes the sidebar:

```
docs/
├── index.md            # landing page for your documentation
├── configuration.md
└── query-editor/
    ├── index.md        # the "Query editor" page and sidebar category
    └── macros.md
```

Every page starts with a frontmatter block:

```markdown
---
title: Configure the data source
description: Add the data source in Grafana and connect it to your database.
sidebar_position: 2
---
```

| Field              | Required | What it does                                                                                         |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `title`            | Yes      | The page heading and its label in the sidebar.                                                       |
| `description`      | Yes      | Used for search engines and link previews.                                                           |
| `sidebar_position` | No       | Orders pages within a folder, lowest first. Pages without one come last. `index.md` is always first. |
| `slug`             | No       | Overrides the URL segment generated from the file name. Not allowed on the root `index.md`.          |

## Headings

Start the page body at `##`. The page title from frontmatter is the only `#` heading, so any `#`
heading you write is removed.

```markdown
## Before you begin

### Permissions
```

`##` and `###` headings are listed in the page's table of contents. Every heading gets an anchor
you can link to. The anchor is the heading text in lowercase, with punctuation removed and spaces
turned into hyphens. `## Before you begin` becomes `#before-you-begin`. A repeated heading gets a
number added: `#permissions-1`.

## Text formatting

```markdown
**bold**, _italic_, ~~strikethrough~~ and `inline code`
```

## Lists

```markdown
1. Click **Connections** in the left-side menu.
1. Click **Add new connection**.

- An unordered item
  - A nested item

- [x] A completed task
- [ ] An open task
```

## Tables

```markdown
| Setting      | Description                            | Required |
| ------------ | -------------------------------------- | -------- |
| **Host URL** | The host name and port of your server. | Yes      |
| **Database** | The name of the database to query.     | Yes      |
```

Use `:---`, `:---:` and `---:` in the separator row to align a column left, center or right.

## Code blocks

Fence code with three backticks and name the language after the opening fence:

````markdown
```sql
SELECT id, name FROM users ORDER BY created_at DESC
```
````

Code is highlighted for common languages, including `bash`, `c`, `cpp`, `csharp`, `css`, `diff`, `go`,
`graphql`, `ini`, `java`, `javascript`, `json`, `kotlin`, `less`, `lua`, `makefile`, `markdown`,
`perl`, `php`, `python`, `r`, `ruby`, `rust`, `scss`, `shell`, `sql`, `swift`, `typescript`,
`xml` and `yaml`. Common short names work too, such as `js`, `ts`, `sh`, `yml`, `html` and `toml`.

A block in any other language, such as `hcl`, `promql` or `dockerfile`, shows as plain code. Name the
language anyway, or use `text` for output and other plain content. A block with no language is
never highlighted.

## Links

Link to another page with a relative path to its `.md` file. Add `#anchor` to link to a heading:

```markdown
Refer to [Configure the data source](./configuration.md#authentication).
Refer to [Macros](./query-editor/macros.md).
```

- The link works on GitHub and is rewritten to the page's URL on grafana.com, including any custom
  `slug`.
- To link to a folder's page, link to its `index.md`, such as `./query-editor/index.md`.
- Don't use absolute paths like `/docs/configuration`, and don't link to your own pages with a full
  `https://grafana.com/...` URL. Use relative paths, so the link keeps working when your docs move.

Reference-style links work too, and are checked the same way:

```markdown
Refer to [Configure the data source][configure].

[configure]: ./configuration.md
```

External links use the full URL. A bare URL such as `https://grafana.com` becomes a link
automatically.

```markdown
Refer to the [YugabyteDB documentation](https://docs.yugabyte.com/).
```

## Images

Save images inside your docs folder, usually in an `img/` folder, and reference them with a
relative path:

```markdown
![The query editor in builder mode](./img/query-builder.png)
```

- Supported formats are PNG, JPEG, WebP and GIF. SVG isn't allowed.
- Static images can be up to 300KB, GIFs up to 1MB and all images together up to 5MB.
- Always write alt text that describes the image. Screen readers read it out, and it's shown if
  the image fails to load.

## Callouts

Use a callout to make a note, tip or warning stand out from the text around it. Start a blockquote
with a callout marker on its own line:

```markdown
> [!NOTE]
> Private data source connect (PDC) is only available in Grafana Cloud.
```

There are five types:

| Marker         | Use it for                                                     |
| -------------- | -------------------------------------------------------------- |
| `[!NOTE]`      | Information the reader should notice, even when skimming.      |
| `[!TIP]`       | Optional advice that helps the reader do something better.     |
| `[!IMPORTANT]` | Information the reader needs to succeed.                       |
| `[!WARNING]`   | Something that needs the reader's attention to avoid problems. |
| `[!CAUTION]`   | A risk, such as losing data or a security issue.               |

- A callout can hold several paragraphs, lists and code blocks. Start every line with `>`.
- The marker must be alone on the first line. `> [!NOTE] Some text` renders as a plain quote.
- An unknown type, such as `[!DANGER]`, renders as a plain quote.
- GitHub uses the same syntax, so callouts look right there too.

## Videos

### YouTube

Put a YouTube link alone in its own paragraph to embed the video:

```markdown
[Getting started with Yugabyte](https://www.youtube.com/watch?v=Qc83dSVe0vQ)
```

- Watch (`youtube.com/watch?v=`), short (`youtu.be/`) and embed (`youtube.com/embed/`) links work.
- The video shows as a thumbnail with a play button. The player loads only when the reader clicks
  play, and uses the privacy-enhanced `youtube-nocookie.com` domain.
- The link text becomes the video title for screen readers.
- A link inside a sentence, or in a list, stays a normal link.
- On GitHub this is a normal link, so the page still reads well there.

### Short videos

Use image syntax with an `.mp4` or `.webm` file inside your docs folder:

```markdown
![Switching to the agenda view](./video/agenda.mp4 'Optional title')
```

- Videos are limited to 2MB each, because docs ship inside every plugin download. Use YouTube for
  anything longer.
- The player has controls, starts muted and never plays by itself. The alt text labels the video
  for screen readers.
- Name the file with letters, digits, hyphens, underscores and dots only, as for images.

## Footnotes

```markdown
YugabyteDB listens on port 5433 by default.[^1]

[^1]: Unless you changed `ysql_port` when you started the cluster.
```

Footnotes are collected at the end of the page.

## Not supported

These are removed when your page is rendered, or shown as plain text:

- **Raw HTML**, for example `<div>`, `<br>`, `<details>` or `<iframe>`. Write it in markdown instead.
- **Hugo shortcodes** such as `{{< figure >}}` or `{{< tabs >}}`.
- **MDX and JSX components.**
- **Video players other than YouTube**, such as Vimeo. Link to the video instead.
- **SVG images, external images and base64 images.** Save a PNG or WebP file in your docs folder.
