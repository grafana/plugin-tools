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
