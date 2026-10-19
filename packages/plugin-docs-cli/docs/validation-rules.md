# Validation rules

Your docs folder is checked against the rules below in two places, with the same results in both:

- **`serve`** - the local preview server you run while writing. It re-validates on every save and
  prints what it finds, but never blocks your preview.
- **`validate`** - what runs in CI, and what `plugin-validator` runs against your plugin before it
  can be published. It fails on any error.

An error you see while writing in `serve` will block publishing, so fix it before you submit your
plugin.

For what you can write in a page, refer to [Supported markdown](./supported-markdown.md).

**Severity:**

- **Error** - blocks validation. Fix this before your docs will pass.
- **Warning** - doesn't block, but worth fixing before you publish.
- **Suggestion** - doesn't block, informational.

## Folder & file structure

| Rule                   | What it checks                                                                                                                              | Severity |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `has-markdown-files`   | Your docs folder must contain at least one markdown page.                                                                                   | Error    |
| `root-index-exists`    | Your docs folder must have an `index.md` at its root - this is the landing page for your documentation.                                     | Error    |
| `nested-dir-has-index` | A subfolder that contains pages needs its own `index.md`. Without one, the sidebar shows an unnamed category using the folder name instead. | Warning  |
| `no-spaces-in-names`   | File and folder names can't contain spaces - they break the URL for that page. Use hyphens instead.                                         | Error    |
| `valid-file-naming`    | File and folder names should use only lowercase letters, digits and hyphens, for clean URLs.                                                | Error    |
| `no-empty-directories` | A folder with no pages or images in it serves no purpose - remove it.                                                                       | Error    |
| `no-symlinks`          | Symbolic links aren't allowed in the docs folder - use real files.                                                                          | Error    |
| `allowed-file-types`   | Only markdown files, images (`png`, `jpg`, `jpeg`, `webp`, `gif`) and videos (`mp4`, `webm`) are allowed in the docs folder.                | Error    |
| `max-nesting-depth`    | A page shouldn't be nested more than 3 folders deep, or it becomes hard to find in the sidebar. Flatten deeply nested pages.                | Error    |
| `docs-path-exists`     | The `docsPath` in `src/plugin.json` must point at a folder that exists.                                                                     | Error    |
| `max-total-pages`      | A docs folder shouldn't have more than 50 pages. Consolidate related pages, or move the long tail to an external resource.                  | Error    |
| `max-total-docs-size`  | The whole docs folder should stay under 10MB, including images - it ships inside the plugin archive.                                        | Warning  |

## Required pages

Panel and data source plugins must document a few fixed topics, so authors, users and agents
find the same information in the same place across every plugin. Each topic can be a single page
(`options.md`) or a folder (`options/`) with at least one page inside it, at the root of your
docs folder.

- **Panel:** `options` and `data-formats`
- **Data source:** `query-editor` and `configure`

App plugins have no required pages, because what an app does varies too much for a fixed set of topics.

| Rule             | What it checks                                                                   | Severity |
| ---------------- | -------------------------------------------------------------------------------- | -------- |
| `required-pages` | Every required page for your plugin type exists at the root of your docs folder. | Error    |

## Page frontmatter

Every page needs a frontmatter block (the `---`-delimited section at the top of the file).

| Rule                             | What it checks                                                                                                                                                 | Severity |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `frontmatter-block-exists`       | The page must start with a frontmatter block.                                                                                                                  | Error    |
| `frontmatter-valid-yaml`         | The frontmatter must be valid YAML.                                                                                                                            | Error    |
| `frontmatter-required-fields`    | `title` and `description` must be present.                                                                                                                     | Error    |
| `frontmatter-field-types`        | `title` and `description` must be strings, `sidebar_position` (if set) must be a number and `keywords` (if set) must be a list of non-empty strings.           | Error    |
| `frontmatter-valid-slug`         | A custom `slug` field must only use letters, digits, underscores, hyphens and forward slashes.                                                                 | Warning  |
| `root-index-no-custom-slug`      | Your root `index.md` can't set a custom `slug`. It's your documentation landing page, and renaming it hides the Documentation tab on grafana.com.              | Error    |
| `no-h1-heading`                  | Don't add a `# Heading` in the page body - the page title already comes from frontmatter, and any h1 you add will be stripped and replaced. Use `##` or lower. | Warning  |
| `no-duplicate-sidebar-position`  | Pages in the same folder can't share a `sidebar_position` - each needs a unique value to control its order.                                                    | Error    |
| `no-duplicate-slugs`             | A custom `slug` must be unique across all of your pages.                                                                                                       | Error    |
| `frontmatter-title-length`       | `title` should be 60 characters or shorter - search engines truncate longer titles in search results.                                                          | Error    |
| `frontmatter-description-length` | `description` should be between 20 and 160 characters - long enough to be useful, short enough that search engines don't cut it off.                           | Error    |

## Images & other assets

| Rule                      | What it checks                                                                                                           | Severity   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `no-svg-files`            | SVG images aren't allowed - they can contain embedded scripts, which is a security risk. Use PNG or WebP instead.        | Error      |
| `referenced-images-exist` | An image referenced in a page (`![alt](img/foo.png)`) must actually exist in your docs folder.                           | Error      |
| `max-image-size`          | Static images (png/jpg/webp) must be 300KB or smaller; GIFs must be 1MB or smaller. Compress or resize oversized images. | Error      |
| `max-video-size`          | Videos (mp4/webm) must be 3MB or smaller. Shorten or compress the video, or upload it to YouTube and link to it.         | Error      |
| `max-total-images-size`   | The total size of all images in your docs folder must stay under 5MB.                                                    | Warning    |
| `image-file-naming`       | Image and video filenames should use only letters, digits, hyphens, underscores and dots.                                | Error      |
| `no-orphaned-images`      | An image or video that no page links to is dead weight - remove it.                                                      | Suggestion |

## Markdown content & security

| Rule                   | What it checks                                                                                                                                                                                                                     | Severity |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `no-raw-html`          | Raw HTML tags aren't allowed in the page body, except `details`, `summary`, `br` and `hr` - use markdown syntax instead. Any other tag is removed when the page is rendered.                                                       | Error    |
| `no-script-tags`       | `<script>` tags and inline event handlers (`onclick`, `onerror`, etc.) aren't allowed anywhere in a page - they're a security risk.                                                                                                | Error    |
| `no-dangerous-urls`    | Links and images can't use a `javascript:`, `vbscript:` or `data:` URL scheme.                                                                                                                                                     | Error    |
| `no-path-traversal`    | Links and image references must stay inside your docs folder. `../` is fine as long as it doesn't go above the docs root.                                                                                                          | Error    |
| `no-base64-images`     | Images can't be embedded as base64 data - save them as a file in your `img/` folder instead.                                                                                                                                       | Error    |
| `no-external-images`   | Images must be hosted in your docs folder, not linked from an external `http(s)://` URL. Download the image and reference it locally.                                                                                              | Error    |
| `no-hugo-shortcodes`   | Docs website shortcodes like `{{< admonition >}}` or `{{% docs/shared %}}` aren't supported and show up as plain text. Write the content in plain markdown instead, as described in [Supported markdown](./supported-markdown.md). | Error    |
| `no-url-placeholders`  | A link or image URL can't contain a placeholder like `<GRAFANA_VERSION>` - nothing replaces it, so the link breaks. Write the real value, such as `latest`.                                                                        | Error    |
| `valid-callout-marker` | A callout marker like `> [!NOTE]` must use a known type (`NOTE`, `TIP`, `IMPORTANT`, `WARNING` or `CAUTION`) and sit alone on the first line of the blockquote. Otherwise the callout renders as a plain quote.                    | Warning  |
| `valid-youtube-link`   | A YouTube link alone in its own paragraph must be a watch, `youtu.be`, embed or Shorts URL with a valid 11-character video id. Otherwise the link is not embedded and renders as a plain link.                                     | Warning  |
| `valid-details-block`  | A `<details>` block needs a blank line after `</summary>`, or its content shows as plain text, and must be closed with `</details>`, or the rest of the page is hidden inside it.                                                  | Warning  |

## Links between pages

| Rule                      | What it checks                                                                                                             | Severity |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| `image-refs-relative`     | An image reference must be a relative path (e.g. `img/foo.png`), not an absolute one (e.g. `/img/foo.png`).                | Error    |
| `internal-links-relative` | A link to another page in your docs must be a relative path, not an absolute one.                                          | Error    |
| `internal-links-resolve`  | A relative link to another page must actually point to a file that exists.                                                 | Error    |
| `anchor-links-resolve`    | A link with a `#section` anchor must match a real heading in the target page (or the current page, for same-page anchors). | Error    |

## Content quality

| Rule                     | What it checks                                                                                                                                                                                                                                                                                                                                | Severity              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `min-content-length`     | A page's body should have at least 150 characters of real content. A heads-up, not a hard requirement - catches pages that are still effectively blank.                                                                                                                                                                                       | Suggestion            |
| `empty-section`          | A heading needs content before the next heading, and a heading followed directly by a deeper heading is fine. A section that still has only its `section-brief` comment is a suggestion, because the brief never renders: write it or remove the heading.                                                                                     | Warning or Suggestion |
| `unfilled-section-brief` | A `section-brief` comment left in a section that already has content is a suggestion. It isn't shown in the catalog, so delete it to keep the page tidy. A page scaffolded earlier may use `<!-- section-brief:start -->` / `<!-- section-brief:end -->` markers instead. Their text is shown, so they are a warning: remove the whole block. | Warning or Suggestion |

## Writing style

These come from the [Grafana Writers' Toolkit](https://grafana.com/docs/writers-toolkit/), the style
guide Grafana's own documentation follows. We transcribe a curated subset of its rules and apply
them here, so you get the same feedback without installing anything extra.

They are advice, not a gate. **No writing-style rule ever blocks publishing**, even in `validate` -
the worst any of them does is print a warning.
Every finding links to the full rule in the toolkit, so you only need to read the ones you hit.
Fix them at your own pace.

| Rule                               | What it checks                                                                                                       | Severity   | Toolkit rule                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- |
| `style-allows-to`                  | Write `allows you to` rather than `allows to`.                                                                       | Warning    | `Grafana.AllowsTo`                 |
| `style-and-or`                     | Avoid `and/or`. Usually `and` already implies `or`.                                                                  | Warning    | `Grafana.AndOr`                    |
| `style-archives`                   | Write `extract` rather than `unzip`, and `archive` rather than `zip file`.                                           | Suggestion | `Grafana.Archives`                 |
| `style-dialog-box`                 | Write `dialog box` rather than `modal` or `dialog`.                                                                  | Warning    | `Grafana.DialogBox`                |
| `style-drop-down`                  | Write `drop-down` rather than `dropdown` or `drop down`.                                                             | Warning    | `Grafana.DropDown`                 |
| `style-end-to-end`                 | Write `end-to-end` rather than `E2E`.                                                                                | Warning    | `Grafana.EndToEnd`                 |
| `style-exclamation`                | Avoid exclamation points in body text.                                                                               | Warning    | `Grafana.Exclamation`              |
| `style-google-ampm`                | Write `AM` and `PM` in caps with a space before them.                                                                | Warning    | `Grafana.GoogleAMPM`               |
| `style-google-date-format`         | Write dates as `July 31, 2016` rather than a numeric format.                                                         | Warning    | `Grafana.GoogleDateFormat`         |
| `style-google-ellipses`            | Avoid ellipses in prose.                                                                                             | Warning    | `Grafana.GoogleEllipses`           |
| `style-google-em-dash`             | Write an em dash without spaces around it.                                                                           | Warning    | `Grafana.GoogleEmDash`             |
| `style-google-en-dash`             | Use an em dash rather than an en dash (`–`).                                                                         | Warning    | `Grafana.GoogleEnDash`             |
| `style-google-gender`              | Use a gender-neutral alternative to the constructs `he/she`, `s/he` or `(s)he`, not pronouns generally.              | Warning    | `Grafana.GoogleGender`             |
| `style-google-gender-bias`         | Use gender-neutral job and role nouns.                                                                               | Warning    | `Grafana.GoogleGenderBias`         |
| `style-google-heading-punctuation` | Don't end a heading with a period.                                                                                   | Warning    | `Grafana.GoogleHeadingPunctuation` |
| `style-google-ly-hyphens`          | Don't hyphenate after an adverb ending in `-ly`.                                                                     | Warning    | `Grafana.GoogleLyHyphens`          |
| `style-google-optional-plurals`    | Write the plural rather than `option(s)`.                                                                            | Warning    | `Grafana.GoogleOptionalPlurals`    |
| `style-google-periods`             | Write acronyms without periods, so `US` rather than `U.S.`.                                                          | Warning    | `Grafana.GooglePeriods`            |
| `style-google-ranges`              | Write `from 10 to 20`, not `from 10-20` or `between 10-20` - the hyphen reads as ambiguous next to "from"/"between". | Warning    | `Grafana.GoogleRanges`             |
| `style-google-slang`               | Avoid slang and idioms, which are hard on translators and non-native readers.                                        | Warning    | `Grafana.GoogleSlang`              |
| `style-google-will`                | Prefer present tense to `will`. Future tense is fine for deprecations and roadmap notes.                             | Suggestion | `Grafana.GoogleWill`               |
| `style-kubernetes`                 | Use correct Kubernetes object and CLI casing, such as `CronJob`, `Pod`, `` `kubectl` `` and `` `kubelet` ``.         | Warning    | `Grafana.Kubernetes`               |
| `style-latin`                      | Write `for example` and `that is` rather than `e.g.` and `i.e.`.                                                     | Warning    | `Grafana.Latin`                    |
| `style-ok`                         | Avoid any form of `OK`/`okay` in prose, except when quoting a UI, an HTTP status code or other code.                 | Warning    | `Grafana.OK`                       |
| `style-ordinal`                    | Write `first` through `ninth` as words; use numerals from `10th`.                                                    | Warning    | `Grafana.Ordinal`                  |
| `style-please`                     | Drop `please` from instructions. Direct imperatives are clearer.                                                     | Warning    | `Grafana.Please`                   |
| `style-quickstart`                 | Write `quickstart` rather than `quick start`.                                                                        | Warning    | `Grafana.Quickstart`               |
| `style-react`                      | Write `React` rather than `React.js` or `ReactJS`.                                                                   | Warning    | `Grafana.React`                    |
| `style-refer-to`                   | When linking, write `refer to [Page]` rather than `see [Page]` or `check out [Page]`.                                | Warning    | `Grafana.ReferTo`                  |
| `style-repeated-words`             | Catches an accidentally repeated word, such as `the the`.                                                            | Warning    | `Grafana.RepeatedWords`            |
| `style-simple`                     | Avoid `easy`, `easily`, `simple` and `simply` - what's simple for you may not be for your reader.                    | Warning    | `Grafana.Simple`                   |
| `style-sql`                        | Write `an SQL` rather than `a SQL`.                                                                                  | Warning    | `Grafana.SQL`                      |
| `style-timeless`                   | Avoid `currently`, `at present` and `soon`, which date the page.                                                     | Suggestion | `Grafana.Timeless`                 |
| `style-wish`                       | Write `want` or `need` rather than `wish`.                                                                           | Warning    | `Grafana.Wish`                     |
| `style-word-list`                  | Use Grafana's preferred term, for example `data source` rather than `datasource`, and `GitHub` rather than `github`. | Warning    | `Grafana.WordList`                 |

## Generated manifest

These rules check the page manifest the CLI generates from your folder structure. You shouldn't
normally see these - if you do, it's almost always a symptom of one of the rules above (e.g. a
page missing its `title`), rather than something to fix directly.

| Rule                  | What it checks                                                                                 | Severity |
| --------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| `manifest-valid`      | Every generated page entry has a title and a slug, and the manifest as a whole is well-formed. | Error    |
| `manifest-refs-exist` | Every file the manifest points to actually exists on disk.                                     | Error    |
