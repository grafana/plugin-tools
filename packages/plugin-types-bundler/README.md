# Grafana / Plugin Types Bundler

> [!WARNING]
> This is an experimental project and may change at any time. It is not yet used in any of our tools and does not reliably work with most of our app plugin implementation patterns.

`@grafana/plugin-types-bundler` is a cli tool that can be used to bundle types from the source code of a Grafana plugin. This single file will wrap all the types up into a single d.ts file which can then be shared with other Grafana plugins.

## Install

```
npm install @grafana/plugin-types-bundler --save-dev
```

## Usage

#### CLI

By calling the binary against an (module.ts|tsx) file, the package will output a single index.d.ts file in the dist directory with your other plugin assets.

```bash
# Run local build
./dist/run.js ~/my-grafana-plugin/src/types/index.ts

# Run latest remote version
npx @grafana/plugin-types-bundler ~/my-grafana-plugin/src/types/index.ts
```

### Output

---

## Contributing

We are always grateful for contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.
