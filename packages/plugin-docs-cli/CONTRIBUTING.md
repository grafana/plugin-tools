# Contributing to Grafana / Plugin Docs CLI

We are always grateful to receive contributions!<br />
The following guidelines help you on how to start with the codebase and how to submit your work.

## Installation

### Prerequisites

You need the Node.js version in [`.nvmrc`](../../.nvmrc) and `npm`. The published CLI supports Node.js 22 or later, but the repository's tooling needs the newer version.

### Installing

```bash
git clone git@github.com:grafana/plugin-tools.git
cd plugin-tools
npm install
```

## Overview

### Technologies

- [**`express`**](https://expressjs.com/) and [**`ejs`**](https://ejs.co/) - serve the local preview
- [**`chokidar`**](https://github.com/paulmillr/chokidar) - watches docs files for live reload
- [**`minimist`**](https://github.com/minimistjs/minimist) - parses argument options
- [**`@grafana/plugin-docs-parser`**](../plugin-docs-parser) - reads frontmatter and renders markdown to HAST

### Folder structure

- `src/bin` - the CLI entry point
- `src/commands` - the `serve`, `build` and `validate` commands
- `src/validation` - the validation engine, its types and one file per group of rules in `rules/`
- `src/server` - the preview server, its templates and styles
- `docs` - the guides for plugin authors and their agents. They ship in the published package

## Development

There are a collection of [commands](#commands) to assist with developing `@grafana/plugin-docs-cli`. Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code changes to the project.

### Commands

Below are the main commands used for developing `@grafana/plugin-docs-cli`. They can be run by either `npx nx run @grafana/plugin-docs-cli:<name_of_command>`, `npm run <name_of_command> -w @grafana/plugin-docs-cli` or navigating to `packages/plugin-docs-cli` and running the command directly as detailed below.

```shell
npm run build # builds @grafana/plugin-docs-cli
```

```shell
npm run dev # watches for changes to files and rebuilds @grafana/plugin-docs-cli automatically
```

```shell
npm run test # runs the tests in watch mode, add -- --run to run them once
```

```shell
npm run lint # lints the source
```

```shell
npm run typecheck # type checks the source
```

To try your changes against a plugin, build the package and run `node <path to>/packages/plugin-docs-cli/dist/bin/run.js serve` from the root of a plugin that has `docsPath` set in `src/plugin.json`.

### Conventions

- Keep the guides in `docs/` in sync with any change a plugin author can see: a command, a flag, a validation rule or what `validate` and `serve` print. [AGENTS.md](./AGENTS.md) lists which guide covers what and how to add a validation rule.
- The `--json` output of `validate` is read by [`plugin-validator`](https://github.com/grafana/plugin-validator), so changing its shape is a breaking change.
- Writing-style rules never get a severity above `warning`. See [AGENTS.md](./AGENTS.md) for how to add one.
- Write tests next to the code as `*.test.ts`.
