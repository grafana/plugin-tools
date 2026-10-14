# {{{pluginName}}} documentation

This folder is the documentation for **{{{pluginName}}}**. It's published on the Documentation tab of
`grafana.com/grafana/plugins/{{pluginId}}/` with each plugin release. This README isn't published.

To learn how plugin docs work and how to write them, read the
[Add documentation to your plugin](https://grafana.com/developers/plugin-tools/how-to-guides/plugin-docs) guide.

## Next steps

1. Fill in or review the pages. Each section has a note that says what belongs there.
1. Run `{{packageManagerName}} run docs:serve` to preview the docs. It also reports warnings for every section left to fill.

## Commands

```bash
{{packageManagerName}} run docs:serve     # local preview at http://localhost:3001
{{packageManagerName}} run docs:validate  # check your docs, including sections left to fill
```
