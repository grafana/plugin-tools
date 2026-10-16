# {{{pluginName}}} documentation

This folder is the documentation for **{{{pluginName}}}**. It's published on the Documentation tab of
`grafana.com/grafana/plugins/{{pluginId}}/` with each plugin release. This README isn't published.

To learn how plugin docs work and how to write them, read the
[Add documentation to your plugin](https://grafana.com/developers/plugin-tools/how-to-guides/plugin-docs) guide.

## Next steps

1. Write the pages. Each section has a note that says what belongs there. **Or** let an AI agent draft them from your source code and README: commit your changes, then run `{{createPluginCmd}} add docs-content`. Review its work either way.
2. Add screenshots, videos and figures where they help readers. Save them inside this folder, for example in `img/`, and link to them with a relative path. `docs:validate` checks their formats and sizes.
3. Run `{{packageManagerName}} run docs:serve` to preview the docs. It also lists every section left to fill.

## Commands

```bash
{{packageManagerName}} run docs:serve     # local preview at http://localhost:3001
{{packageManagerName}} run docs:validate  # check your docs, including sections left to fill
```
