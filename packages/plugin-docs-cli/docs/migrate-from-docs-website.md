# Migrate from the docs website

This guide explains how to move plugin docs from the [docs website](https://grafana.com/docs/) to
plugin docs, which ship with your plugin and show on its page in the plugin catalog. Follow it step
by step, by hand or with an agent. For everything plugin docs support, refer to
[Supported markdown](./supported-markdown.md). For the checks the CLI runs, refer to
[Validation rules](./validation-rules.md).

Plugin docs are plain markdown. The docs website adds shortcodes (`{{< ... >}}` and `{{% ... %}}`),
extra frontmatter and site-wide link features that plugin docs don't have. Most of the work is
replacing those with plain markdown.

## 1. Set up the docs folder

1. Create a docs folder in your plugin repository, for example `docs/`, and set `"docsPath"` to its
   path, relative to the repository root, in `src/plugin.json`:

   ```json
   {
     "docsPath": "docs"
   }
   ```

2. Copy the pages from the docs website source folder, usually `docs/sources/`, into the docs
   folder. The docs folder can only hold pages, images and videos, so don't copy the docs website's
   build files, such as `Makefile` or `make-docs`.
3. Rename every `_index.md` to `index.md`. The root `index.md` is the landing page of your
   documentation. A folder's `index.md` is the page for that folder in the sidebar.
4. Make sure the required pages for your plugin type exist at the root of the docs folder, as a
   page or a folder. Rename existing pages to match:
   - **Data source:** `configuration` and `query-editor`. A docs website page called `configure.md`
     becomes `configuration.md`.
   - **Panel:** `options` and `data-formats`.

## 2. Convert frontmatter

Plugin docs support four frontmatter fields. Keep `title` and `description`, convert `weight` and
remove everything else.

| Docs website field                                                                        | Plugin docs                                                                                                                    |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `title`                                                                                   | Keep. It's the page heading and its label in the sidebar. Keep it to 60 characters or fewer.                                   |
| `description`                                                                             | Keep. Write one if it's missing - it's required. Keep it between 20 and 160 characters.                                        |
| `weight`                                                                                  | Becomes `sidebar_position`. Keep the order, but every page in a folder needs a different value. `index.md` always comes first. |
| `menuTitle`                                                                               | Remove. The sidebar uses `title`, so shorten `title` instead if it's too long for the sidebar.                                 |
| `slug`                                                                                    | Keep if it only uses letters, digits, underscores, hyphens and slashes. Remove it from the root `index.md`.                    |
| `refs`                                                                                    | Use it to rewrite `ref:` links (see [Convert links](#4-convert-links)), then remove it.                                        |
| `aliases`                                                                                 | Remove. Plugin docs have no redirects.                                                                                         |
| `keywords`, `labels`, `review_date`, `last_reviewed`, `version`, `canonical` and the rest | Remove.                                                                                                                        |

## 3. Replace shortcodes

Shortcodes show up as plain text in plugin docs, and validation reports each one. Replace them as
follows.

### Admonition

Becomes a callout. Map the type to its marker and start every line with `>`:

```markdown
{{< admonition type="note" >}}
Private data source connect (PDC) is only available in Grafana Cloud.
{{< /admonition >}}
```

```markdown
> [!NOTE]
> Private data source connect (PDC) is only available in Grafana Cloud.
```

| `type`      | Marker         |
| ----------- | -------------- |
| `note`      | `[!NOTE]`      |
| `tip`       | `[!TIP]`       |
| `important` | `[!IMPORTANT]` |
| `warning`   | `[!WARNING]`   |
| `caution`   | `[!CAUTION]`   |

Keep the marker alone on the first line, and keep any lists or code blocks inside the callout with
`>` in front of each line.

### Figure

Becomes a markdown image. Download the image into the docs folder (see
[Move images and videos](#5-move-images-and-videos)) and use `alt` as the alt text:

```markdown
{{< figure src="/media/docs/grafana/query-builder.png" class="border" alt="The query builder." >}}
```

```markdown
![The query builder.](./img/query-builder.png)
```

- Drop `class`, `width`, `align` and `max-width`. Plugin docs have no image sizing or styling.
- There are no captions. If `caption` says something the alt text doesn't, add it as a sentence
  before or after the image. Otherwise drop it.
- If the figure has no `alt`, write one that describes the image.

### YouTube

Becomes a YouTube link alone in its own paragraph, which shows as an embedded video. Use the video
title as the link text:

```markdown
{{< youtube id="UVMysEjouNo" >}}
```

```markdown
[Getting started with the data source](https://www.youtube.com/watch?v=UVMysEjouNo)
```

### Video embed

Becomes image syntax with an `.mp4` or `.webm` file. Download the video into the docs folder and
write alt text that describes it:

```markdown
{{< video-embed src="/media/docs/grafana/panels/scroll.mp4" >}}
```

```markdown
![Scrolling through the panel.](./video/scroll.mp4)
```

Videos can be up to 3MB each. If a video is bigger, upload it to YouTube and link to it instead.

### Collapse

Becomes a `<details>` block. Use the `title` as the `<summary>`, and leave a blank line after
`</summary>`:

```markdown
{{< collapse title="Full example" >}}
...
{{< /collapse >}}
```

```markdown
<details>
<summary>Full example</summary>

...

</details>
```

### Other shortcodes

| Shortcode                                       | Replace with                                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/shared`                                   | Copy the shared content into the page, and convert it like the rest of the page. If it's long and lives elsewhere, link to it instead. |
| `docs/play`                                     | A link, such as `[Try it on Grafana Play](https://play.grafana.org/...)`, using the shortcode's `url`.                                 |
| `docs/public-preview` or `docs/private-preview` | A `> [!NOTE]` callout saying the feature is in public or private preview, and naming any feature toggle it needs.                      |
| `card-grid`                                     | A list of links to the pages the cards point to.                                                                                       |
| `docs/hero-simple`                              | Remove it. Keep its text as the first paragraph of the page if it says something useful.                                               |
| `section`                                       | A list of links to the pages in that folder.                                                                                           |
| `param`                                         | The value the parameter stands for.                                                                                                    |
| Any other shortcode                             | Plain markdown with the same meaning, or remove it.                                                                                    |

## 4. Convert links

| Docs website link                                                                  | Plugin docs                                                                                                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| To a page of this plugin, such as `/docs/plugins/<plugin-id>/<VERSION>/configure/` | A relative link to the `.md` file, such as `./configuration.md`. Keep any `#anchor`.                                                                               |
| To another page on the docs website, such as `/docs/grafana/latest/alerting/`      | A full URL, such as `https://grafana.com/docs/grafana/latest/alerting/`.                                                                                           |
| `ref:` links, such as `[Explore](ref:explore)`                                     | Look up the name in the `refs` frontmatter and use its `destination`, converted as in the two rows above. Use the destination whose `pattern` is `/docs/grafana/`. |
| A URL with a placeholder, such as `/docs/grafana/<GRAFANA_VERSION>/`               | Replace the placeholder with a real value, such as `latest`. Nothing fills it in.                                                                                  |

- Write every link to a page of this plugin as a relative path to its `.md` file, so it works on
  GitHub and in the catalog.
- Remove custom heading anchors such as `{#install}` from headings, and update links that use them
  to the generated anchor. `## Install the plugin` becomes `#install-the-plugin`.

## 5. Move images and videos

Docs website pages load media from `/media/...` on grafana.com. Plugin docs only show files in the
docs folder.

1. Download each file from `https://grafana.com` plus its path, for example
   `https://grafana.com/media/docs/grafana/query-builder.png`.
2. Save images in an `img/` folder and videos in a `video/` folder inside the docs folder. Use only
   letters, digits, hyphens, underscores and dots in file names.
3. Reference each file with a relative path, such as `./img/query-builder.png`.
4. Keep within the limits: static images up to 300KB, GIFs up to 1MB, all images together up to 5MB
   and videos up to 3MB each. Compress or resize anything bigger.
5. SVG isn't allowed. Convert SVG images to PNG or WebP.

## 6. Clean up the page body

- Remove a `# Heading` at the top of the page. The page heading comes from `title`. Start the body
  at `##`.
- Remove raw HTML other than `<details>`, `<summary>`, `<br>` and `<hr>`, and write it in markdown
  instead.
- Put placeholders in prose, such as `<USER>` or `<your-api-key>`, in inline code. Without
  backticks, the angle brackets can make them an HTML tag, and they disappear from the page.
  Placeholders inside code blocks are fine.

## 7. Check the result

1. Run `npx @grafana/plugin-docs-cli validate` from the plugin repository root. Fix every error.
   Check the warnings too, since most of them mean something renders differently than you expect.
2. Run `npx @grafana/plugin-docs-cli serve` and read the pages in the preview. Compare them with the
   pages on the docs website, and check that images, videos, callouts and links work.
