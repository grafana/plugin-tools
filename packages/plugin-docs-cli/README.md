# @grafana/plugin-docs-cli

Preview, validate and build Grafana plugin documentation locally.

Plugin docs are plain markdown pages that live next to your plugin's code. They ship with each release and appear as a **Documentation** tab on the plugin's catalog page. This CLI previews them, checks them against the same rules the release pipeline uses and builds them for publishing.

## Requirements

- Node.js 22 or later.
- A plugin with `"docsPath": "docs"` (or another folder) set in `src/plugin.json`. The CLI reads `docsPath` to locate your docs.

To add plugin docs to an existing plugin, run `npx @grafana/create-plugin@latest add docs`. See [Add documentation to your plugin](https://grafana.com/developers/plugin-tools/how-to-guides/plugin-docs) for the full walkthrough.

## Usage

Run the CLI from the root of your plugin:

```bash
npx @grafana/plugin-docs-cli <command> [options]
```

`create-plugin add docs` adds the CLI as a dev dependency and these scripts to your `package.json`:

| Script          | Command                                      |
| --------------- | -------------------------------------------- |
| `docs:serve`    | `plugin-docs-cli serve --port 3001 --reload` |
| `docs:validate` | `plugin-docs-cli validate`                   |

### `serve`

Starts a local preview that shows your pages as they appear in the catalog.

```bash
plugin-docs-cli serve
plugin-docs-cli serve --port 3001 --reload
```

| Option           | Description                                   | Default |
| ---------------- | --------------------------------------------- | ------- |
| `--port`, `-p`   | Port for the preview server.                  | `3001`  |
| `--reload`, `-r` | Reload the browser when you save a docs file. | off     |

The preview also reports validation problems as you save.

### `validate`

Checks your docs against a set of rules covering file structure, frontmatter, images, links and writing style. It exits with code `0` when there are no errors and `1` when there is at least one. Warnings don't change the exit code.

```bash
plugin-docs-cli validate
plugin-docs-cli validate --json
plugin-docs-cli validate --dist
plugin-docs-cli validate --dist path/to/plugin
```

| Option         | Description                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--json`       | Print the result as JSON. See [JSON output](#json-output).                                                         |
| `--dist [dir]` | Check the docs your plugin build ships, including `manifest.json`, instead of the source docs. Defaults to `dist`. |

See [Validation rules](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/validation-rules.md) for the full list and what each rule checks.

#### JSON output

The plugin validator reads this output to decide whether a release passes, so treat its shape as a contract.

```json
{
  "valid": false,
  "diagnostics": [
    {
      "rule": "frontmatter-valid-yaml",
      "severity": "error",
      "file": "index.md",
      "line": 1,
      "title": "Invalid YAML in frontmatter",
      "detail": "..."
    }
  ],
  "guide": "node_modules/@grafana/plugin-docs-cli/docs/index.md"
}
```

- `valid` is `false` when any diagnostic has the `error` severity.
- `severity` is `error`, `warning` or `info`.
- `file` and `line` are present when a diagnostic points at a place in a file.
- `guide` is where to read the authoring guides that match the installed CLI version.

### `build`

Copies your docs to `dist/<docsPath>/` and writes `manifest.json` next to them. The manifest holds the page tree and each page's title, slug, frontmatter, headings and content. Only allowed file types are copied.

```bash
plugin-docs-cli build
```

`validate --dist` checks a built plugin, so run it after your plugin build to check what you ship.

## Writing docs

Start with [Add documentation to your plugin](https://grafana.com/developers/plugin-tools/how-to-guides/plugin-docs) on the developer portal. The guides below ship with the package:

- [Authoring guide](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/authoring.md) covers page shape, style and keeping docs in sync with your plugin's source.
- [Supported markdown](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/supported-markdown.md) lists everything you can use and how to write it.
- [Migrate from the docs website](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/migrate-from-docs-website.md) helps you move existing docs.

AI agents and authors can read the version that matches their installed CLI from `node_modules/@grafana/plugin-docs-cli/docs/`, starting at `index.md`. `validate` prints the path at the end of its output. Under Yarn PnP, where the package is zipped and can't be read from disk, it prints a GitHub URL pinned to the installed version instead.

## Related packages

- [@grafana/plugin-docs-parser](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-docs-parser) turns each page's markdown into HAST. The CLI uses it for the preview and for validation, and the catalog uses it to render pages.
- [@grafana/create-plugin](https://github.com/grafana/plugin-tools/tree/main/packages/create-plugin) scaffolds plugin docs with `add docs`.

## Contributing

We welcome contributions. See the [contributing guide](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/CONTRIBUTING.md) to get started.

## License

[Apache 2.0](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/LICENSE)
