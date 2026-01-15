# @grafana/react-detect

Detect React 19 breaking changes in Grafana plugins.

## Usage

First make sure to build the frontend of your plugin so sourcemaps are present in the `dist/` directory.

```bash
npm run build
```

Then run from your plugin root directory (where `package.json` exists):

```bash
npx @grafana/react-detect

```

### Options

- `--pluginRoot`: Pass the root directory of the plugin. Defaults to the current working directory.
- `--json`: Output the results as json.
- `--skipBuildTooling`: Skip webpack configuration checks (jsx-runtime externalization). Useful when build config is missing or not applicable.
- `--skipDependencies`: Skip dependency tree analysis. Useful when lockfile is missing or for faster analysis of source code only.
