# @grafana/ts-grapher

A small utility for analyzing TypeScript dependency relationships. It searches for a given symbol and outputs its dependencies in [DOT](https://en.wikipedia.org/wiki/DOT_%28graph_description_language%29) format.

This can be useful when exploring complex dependency trees or when planning refactors.

> [!WARNING]
> Currently only tested on macOS

## Installation

```bash
npm i
```

## Usage

The tool expects three arguments:

1. The name of the function, variable, or class to search for
2. The path to the file where the symbol is declared
3. The path to the root TypeScript `tsconfig.json` file

```bash
npx @grafana/ts-grapher getExtensionPointPluginDependencies /Users/hugoh/git/grafana/public/app/features/plugins/extensions/utils.tsx /Users/hugoh/git/grafana/tsconfig.json
```

### Options

#### --level

Controls how many levels of dependencies are traversed.

- Default: 1
- Higher values will increase processing time

```bash
npx @grafana/ts-grapher getExtensionPointPluginDependencies /Users/hugoh/git/grafana/public/app/features/plugins/extensions/utils.tsx /Users/hugoh/git/grafana/tsconfig.json --level=3
```

#### --svg

Generates an SVG visualization in addition to the .gv file.
Requires [Graphviz](https://graphviz.org/download/) to be installed and available in your PATH.

```bash
npx @grafana/ts-grapher getExtensionPointPluginDependencies /Users/hugoh/git/grafana/public/app/features/plugins/extensions/utils.tsx /Users/hugoh/git/grafana/tsconfig.json --svg
```

#### --debug

Generates more log output

```bash
npx @grafana/ts-grapher getExtensionPointPluginDependencies /Users/hugoh/git/grafana/public/app/features/plugins/extensions/utils.tsx /Users/hugoh/git/grafana/tsconfig.json --debug
```

## Output

`.gv` files are written to the out directory

When `--svg` is enabled, a corresponding `.svg` file is generated.

You can also output to many other [formats](https://graphviz.org/docs/outputs/) by calling `dot` manually like

```bash
dot -Tpng getExtensionPointPluginDependencies.gv > getExtensionPointPluginDependencies.png
```

Read more about output formats [here](https://graphviz.org/docs/outputs/).

## License

Apache License v2
