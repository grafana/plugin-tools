# Contributing to Grafana / Plugin Docs CLI

We are always grateful to receive contributions!<br />
Please read the main [contributing guide](../../CONTRIBUTING.md) for setup and how to submit your work.

## Folder structure

- `src/bin` - the CLI entry point
- `src/commands` - the `serve`, `build` and `validate` commands
- `src/validation` - the validation engine, its types and one file per group of rules in `rules/`
- `src/server` - the preview server, its templates and styles
- `docs` - the guides for plugin authors and their agents. They ship in the published package

## Commands

Run these with `npm run <command> -w @grafana/plugin-docs-cli`:

```shell
npm run build # builds the package
npm run dev # rebuilds when files change
npm run test # runs the tests in watch mode, add -- --run to run them once
npm run lint # lints the source
npm run typecheck # type checks the source
```

To try your changes against a plugin, build the package and run `node <path to>/packages/plugin-docs-cli/dist/bin/run.js serve` from the root of a plugin that has `docsPath` set in `src/plugin.json`.

## Conventions

See [AGENTS.md](./AGENTS.md) for which guide in `docs/` to update when you change a command, a flag or a validation rule, and how to add a rule.

The `--json` output of `validate` is read by [`plugin-validator`](https://github.com/grafana/plugin-validator), so changing its shape is a breaking change.
