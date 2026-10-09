# Migrate from the docs website

This guide explains how to move plugin docs from the [docs website](https://grafana.com/docs/) to
plugin docs, which ship with your plugin and show in the plugin catalog. Plugin docs are plain
markdown, so most of the work is replacing the docs website's shortcodes, frontmatter and links.
For everything plugin docs support, refer to [Supported markdown](./supported-markdown.md).

## 1. Set up the docs folder

1. From the plugin repository root, run:

   ```bash
   npx @grafana/create-plugin@latest add docs --docsPath catalogDocs
   ```

   This creates the `catalogDocs/` folder with stub pages, sets `docsPath` in `src/plugin.json` and
   adds `docs:serve` and `docs:validate` scripts. Use a new folder, because `docs/` usually still
   holds the docs website sources.

2. Copy the pages from the docs website source folder, usually `docs/sources/`, into
   `catalogDocs/`, replacing the stubs. Copy only pages, not build files such as `Makefile`. Fill in
   or delete any stub you don't replace.
3. Rename every `_index.md` to `index.md`.
4. Keep the required pages for your plugin type at the root, and rename existing pages to match:
   `configuration` and `query-editor` for a data source, `options` and `data-formats` for a panel.
   For example, `configure.md` becomes `configuration.md`.

## 2. Convert frontmatter

| Docs website field                                      | Plugin docs                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `title` and `description`                               | Keep. Both are required. Keep `title` to 60 characters and `description` to 20-160 characters. |
| `weight`                                                | Becomes `sidebar_position`. Every page in a folder needs a different value.                    |
| `slug`                                                  | Keep, except on the root `index.md`.                                                           |
| `refs`                                                  | Use it to rewrite `ref:` links, then remove it.                                                |
| `menuTitle`, `aliases`, `keywords`, `labels` and others | Remove. The sidebar uses `title`, and there are no redirects.                                  |

## 3. Replace shortcodes

Shortcodes show as plain text in plugin docs. Replace each one with markdown. For example, an
admonition becomes a callout, with `>` at the start of every line:

```markdown
{{< admonition type="note" >}}
Private data source connect (PDC) is only available in Grafana Cloud.
{{< /admonition >}}
```

```markdown
> [!NOTE]
> Private data source connect (PDC) is only available in Grafana Cloud.
```

| Shortcode                                     | Replace with                                                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `admonition`                                  | A callout. `type` maps to the marker: `note` to `[!NOTE]`, and the same for `tip`, `important`, `warning` and `caution`.      |
| `figure`                                      | `![alt](./img/file.png)`. Drop `class`, `width` and `align`. There are no captions, so work a useful `caption` into the text. |
| `youtube`                                     | `[Video title](https://www.youtube.com/watch?v=<id>)` alone in its own paragraph, which embeds the video.                     |
| `video-embed`                                 | `![What the video shows](./video/file.mp4)`. Videos can be up to 3MB. Upload bigger ones to YouTube.                          |
| `collapse`                                    | `<details>` with the `title` in `<summary>`, and a blank line after `</summary>`.                                             |
| `docs/shared`                                 | The shared content, copied into the page and converted.                                                                       |
| `docs/play`                                   | A link to the shortcode's `url`, such as `[Try it on Grafana Play](https://play.grafana.org/...)`.                            |
| `docs/public-preview`, `docs/private-preview` | A `> [!NOTE]` callout saying the feature is in preview.                                                                       |
| `card-grid`, `section`                        | A list of links to the pages.                                                                                                 |
| Anything else                                 | Plain markdown with the same meaning, or remove it.                                                                           |

## 4. Convert links

| Docs website link                                                         | Plugin docs                                                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| To this plugin's pages, such as `/docs/plugins/<id>/<VERSION>/configure/` | A relative link to the `.md` file, such as `./configuration.md#anchor`.                          |
| To other docs website pages, such as `/docs/grafana/latest/alerting/`     | A full URL: `https://grafana.com/docs/grafana/latest/alerting/`.                                 |
| `ref:` links, such as `[Explore](ref:explore)`                            | The `destination` for that name in `refs`, for the `/docs/grafana/` pattern, converted as above. |
| Placeholders in URLs, such as `<GRAFANA_VERSION>`                         | A real value, such as `latest`.                                                                  |

Remove custom heading anchors such as `{#install}`, and point links at the generated anchor:
`## Install the plugin` becomes `#install-the-plugin`.

## 5. Move images and videos

Download each `/media/...` file from `https://grafana.com/media/...` into `img/` or `video/` in the
docs folder, and link to it with a relative path. Keep static images to 300KB, GIFs to 1MB, all
images to 5MB in total and videos to 3MB each. Convert SVG images to PNG or WebP.

## 6. Clean up the page body

- Remove the `# Heading` at the top of the page. The heading comes from `title`.
- Remove raw HTML other than `<details>`, `<summary>`, `<br>` and `<hr>`.
- Put placeholders in prose, such as `<USER>`, in inline code, or they can disappear from the page.

## 7. Check the result

Run `npm run docs:validate`, or the yarn or pnpm equivalent, and fix every error. Most warnings mean something renders differently
than you expect, so check those too. Then run `npm run docs:serve`, compare the pages with the docs
website and check that images, videos, callouts and links work.
