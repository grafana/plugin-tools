# Validation rules

Your docs folder is checked against the rules below in two places:

- **`serve`** - the local preview server you run while writing. It re-validates on every save,
  but leniently, so a half-finished page doesn't block your preview.
- **`validate`** - a stricter pass. This is what runs in CI, and what `plugin-validator` runs
  against your plugin before it can be published.

Most rules behave the same in both. A few are only warnings/suggestions in `serve` but become
blocking errors in `validate` - marked with † below. If you see one of those while writing, fix
it before you submit your plugin, since it will block publishing.

**Severity:**

- **Error** - blocks validation. Fix this before your docs will pass.
- **Warning** - shown now, doesn't block yet.
- **Suggestion** - shown now, doesn't block yet, informational.

## Folder & file structure

| Rule | What it checks | Severity |
| ---- | -------------- | -------- |
| `has-markdown-files` | Your docs folder must contain at least one markdown page. | Error |
| `root-index-exists` | Your docs folder must have an `index.md` at its root - this is the landing page for your documentation. | Error |
| `nested-dir-has-index` | A subfolder that contains pages needs its own `index.md`. Without one, the sidebar shows an unnamed category using the folder name instead. | Warning |
| `no-spaces-in-names` | File and folder names can't contain spaces - they break the URL for that page. Use hyphens instead. | Error |
| `valid-file-naming` | File and folder names should use only lowercase letters, digits and hyphens, for clean URLs. | Warning † |
| `no-empty-directories` | A folder with no pages or images in it serves no purpose - remove it. | Warning † |
| `no-symlinks` | Symbolic links aren't allowed in the docs folder - use real files. | Error |
| `allowed-file-types` | Only markdown files and images (`png`, `jpg`, `jpeg`, `webp`, `gif`) are allowed in the docs folder. | Suggestion † |
| `max-nesting-depth` | A page shouldn't be nested more than 3 folders deep, or it becomes hard to find in the sidebar. Flatten deeply nested pages. | Suggestion †

## Page frontmatter

Every page needs a frontmatter block (the `---`-delimited section at the top of the file).

| Rule                             | What it checks                                                                                                                                                 | Severity     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `frontmatter-block-exists`       | The page must start with a frontmatter block.                                                                                                                  | Error        |
| `frontmatter-valid-yaml`         | The frontmatter must be valid YAML.                                                                                                                            | Error        |
| `frontmatter-required-fields`    | `title` and `description` must be present.                                                                                                                     | Error        |
| `frontmatter-field-types`        | `title` and `description` must be strings, and `sidebar_position` (if set) must be a number.                                                                   | Error        |
| `frontmatter-valid-slug`         | A custom `slug` field must only use letters, digits, underscores, hyphens and forward slashes.                                                                 | Warning      |
| `no-h1-heading`                  | Don't add a `# Heading` in the page body - the page title already comes from frontmatter, and any h1 you add will be stripped and replaced. Use `##` or lower. | Warning      |
| `no-duplicate-sidebar-position`  | Pages in the same folder can't share a `sidebar_position` - each needs a unique value to control its order.                                                    | Warning †    |
| `no-duplicate-slugs`             | A custom `slug` must be unique across all of your pages.                                                                                                       | Error        |
| `frontmatter-title-length`       | `title` should be 60 characters or shorter - search engines truncate longer titles in search results.                                                          | Suggestion † |
| `frontmatter-description-length` | `description` should be between 20 and 160 characters - long enough to be useful, short enough that search engines don't cut it off.                           | Suggestion † |

## Images & other assets

| Rule                      | What it checks                                                                                                           | Severity                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `no-svg-files`            | SVG images aren't allowed - they can contain embedded scripts, which is a security risk. Use PNG or WebP instead.        | Error                               |
| `referenced-images-exist` | An image referenced in a page (`![alt](img/foo.png)`) must actually exist in your docs folder.                           | Error                               |
| `max-image-size`          | Static images (png/jpg/webp) must be 300KB or smaller; GIFs must be 1MB or smaller. Compress or resize oversized images. | Suggestion †                        |
| `max-total-images-size`   | The total size of all images in your docs folder must stay under 5MB. Only checked as part of the pre-publish check.     | Warning (pre-publish check only)    |
| `image-file-naming`       | Image filenames should use only letters, digits, hyphens, underscores and dots.                                          | Suggestion †                        |
| `no-orphaned-images`      | An image that no page links to is dead weight - remove it. Only checked as part of the pre-publish check.                | Suggestion (pre-publish check only) |
| `max-data-uri-size`       | An inline (data URI) image must be 300KB or smaller. Save larger images as files instead of embedding them.              | Suggestion †                        |

## Markdown content & security

| Rule                 | What it checks                                                                                                                        | Severity  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `no-raw-html`        | Raw HTML tags aren't allowed in the page body (except `br`, `wbr`, `hr`, `details` and `summary`) - use markdown syntax instead.      | Warning † |
| `no-script-tags`     | `<script>` tags and inline event handlers (`onclick`, `onerror`, etc.) aren't allowed anywhere in a page - they're a security risk.   | Error     |
| `no-dangerous-urls`  | Links and images can't use a `javascript:`, `vbscript:` or `data:` URL scheme.                                                        | Error     |
| `no-path-traversal`  | Links and image references can't contain `../` to escape the docs folder.                                                             | Error     |
| `no-base64-images`   | Images can't be embedded as base64 data - save them as a file in your `img/` folder instead.                                          | Error     |
| `no-external-images` | Images must be hosted in your docs folder, not linked from an external `http(s)://` URL. Download the image and reference it locally. | Warning † |

## Links between pages

| Rule                      | What it checks                                                                                                             | Severity  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------- |
| `image-refs-relative`     | An image reference must be a relative path (e.g. `img/foo.png`), not an absolute one (e.g. `/img/foo.png`).                | Error     |
| `internal-links-relative` | A link to another page in your docs must be a relative path, not an absolute one.                                          | Warning † |
| `internal-links-resolve`  | A relative link to another page must actually point to a file that exists.                                                 | Warning † |
| `anchor-links-resolve`    | A link with a `#section` anchor must match a real heading in the target page (or the current page, for same-page anchors). | Warning † |

## Content quality

| Rule                     | What it checks                                                                                                                                                                                               | Severity                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `min-content-length`     | A page's body should have at least 150 characters of real content. A heads-up, not a hard requirement - catches pages that are still effectively blank. Only checked as part of the pre-publish check.       | Suggestion (pre-publish check only) |
| `unfilled-section-brief` | If you scaffolded your docs from a create-plugin template, remove the `<!-- section-brief:start -->` / `<!-- section-brief:end -->` placeholder block once you've written the real content for that section. | Warning †                           |

## Generated manifest

These rules check the page manifest the CLI generates from your folder structure. You shouldn't
normally see these - if you do, it's almost always a symptom of one of the rules above (e.g. a
page missing its `title`), rather than something to fix directly.

| Rule                  | What it checks                                                                                 | Severity |
| --------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| `manifest-valid`      | Every generated page entry has a title and a slug, and the manifest as a whole is well-formed. | Error    |
| `manifest-refs-exist` | Every file the manifest points to actually exists on disk.                                     | Error    |
