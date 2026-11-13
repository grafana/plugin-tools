# Contributing to Grafana / Plugin Docs Parser

We are always grateful to receive contributions!<br />
Please read the main [contributing guide](../../CONTRIBUTING.md) for setup and how to submit your work.

## Folder structure

- `src/parser.ts` - `parseMarkdown`, `readSnippets` and the order of the pipeline
- `src/plugins` - one remark or rehype plugin per file, each with a test next to it
- `src/snippets.ts` - the text of every snippet
- `src/index.ts` - the public API. Anything not exported there is private

## Commands

Run these with `npm run <command> -w @grafana/plugin-docs-parser`:

```shell
npm run build # builds the package
npm run test # runs the tests in watch mode, add -- --run to run them once
npm run lint # lints the source
npm run typecheck # type checks the source
```

To see your changes in the local preview, build the parser and `@grafana/plugin-docs-cli`, then run `node <path to>/packages/plugin-docs-cli/dist/bin/run.js serve` from the root of a plugin that has `docsPath` set in `src/plugin.json`.

## Conventions

See [AGENTS.md](./AGENTS.md) for what changes with the parser's output, which side of `rehype-sanitize` a new plugin belongs on and what else to update when you add syntax or a snippet.
