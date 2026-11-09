# Contributing to Grafana / Plugin Docs Parser

We are always grateful to receive contributions!<br />
The following guidelines help you on how to start with the codebase and how to submit your work.

## Installation

### Prerequisites

You need the Node.js version in [`.nvmrc`](../../.nvmrc) and `npm`. The published package supports Node.js 22 or later, but the repository's tooling needs the newer version.

### Installing

```bash
git clone git@github.com:grafana/plugin-tools.git
cd plugin-tools
npm install
```

## Overview

### Technologies

- [**`unified`**](https://unifiedjs.com/) - the pipeline that turns markdown into HAST
- [**`remark`**](https://github.com/remarkjs/remark) and [**`rehype`**](https://github.com/rehypejs/rehype) - the markdown and HTML plugins in that pipeline
- [**`js-yaml`**](https://github.com/nodeca/js-yaml) - reads page frontmatter

### Folder structure

- `src/parser.ts` - `parseMarkdown`, `readSnippets` and the order of the pipeline
- `src/plugins` - one remark or rehype plugin per file, each with a test next to it
- `src/snippets.ts` - the text of every snippet
- `src/types.ts` - the types of the manifest, pages and frontmatter
- `src/index.ts` - the public API. Anything not exported there is private

## Development

There are a collection of [commands](#commands) to assist with developing `@grafana/plugin-docs-parser`. Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code changes to the project.

### Commands

Below are the main commands used for developing `@grafana/plugin-docs-parser`. They can be run by either `npx nx run @grafana/plugin-docs-parser:<name_of_command>`, `npm run <name_of_command> -w @grafana/plugin-docs-parser` or navigating to `packages/plugin-docs-parser` and running the command directly as detailed below.

```shell
npm run build # builds @grafana/plugin-docs-parser
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

To see your changes in the local preview, build the parser and `@grafana/plugin-docs-cli`, then run `node <path to>/packages/plugin-docs-cli/dist/bin/run.js serve` from the root of a plugin that has `docsPath` set in `src/plugin.json`.

### Conventions

See [AGENTS.md](./AGENTS.md) for what changes with the parser's output and what else to update when you add syntax or a snippet.

- Output is sanitized. See [AGENTS.md](./AGENTS.md#sanitizing) for which side of `rehype-sanitize` a new plugin belongs on.
- Write tests next to the code as `*.test.ts`.
