# {{pluginName}} documentation

This folder is the documentation for **{{pluginName}}**. It's published on the Documentation tab of
`grafana.com/grafana/plugins/{{pluginId}}/` with each plugin release. This README isn't published.

To learn how plugin docs work and how to write them, read the
[Plugin docs guides](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-docs-cli/docs/README.md).

## Next steps

1. Fill in the stub pages. Each section has a note that says what belongs there.
1. Using a coding agent? Run `/bootstrap-plugin-docs` to draft the pages from your source code and README.
1. Before you release, run `{{packageManagerName}} run docs:validate:release`.

## Commands

```bash
{{packageManagerName}} run docs:serve             # local preview at http://localhost:3001
{{packageManagerName}} run docs:validate          # check your docs while you write
{{packageManagerName}} run docs:validate:release  # check your docs are ready to publish
```
