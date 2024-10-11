# Grafana / Plugin Types Bundler

> [!WARNING]
> This is an experimental project and may change at any time. It is not yet used in any of our tools and should not be considered production ready.

`@grafana/plugin-types-bundler` is a cli tool that can be used to bundle types from the source code of a Grafana plugin. This single file will wrap all the types up into a single d.ts file which can then be shared with other Grafana plugins.

It is recommended that you create a separate `.ts` file that exports only the types you want to expose rather than run this tool against the plugins `module.{ts,tsx}` file.

## Install

```
npm install @grafana/plugin-types-bundler --save-dev
```

## Usage

#### CLI

Call the binary against a typescript file and the package will output a single index.d.ts file in the output directory.

```bash
npx @grafana/plugin-types-bundler --entry-point ~/my-grafana-plugin/src/types/index.ts
```

#### API

If need be you can import the `generateTypes` function that writes out the file to disk.

```js
import { generateTypes } from '@grafana/plugin-types-bundler';

await generateTypes({ entryPoint: './types.ts' });
```

### Output

The package outputs a single index.d.ts file containing all the types and their dependencies.

## Contributing

We are always grateful for contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.

### Local development

To run this package locally during development follow these steps:

- clone/fork this repo
- run `npm install`
- run `npm run build -w @grafana/plugin-types-bundler`
- run `cd packages/plugin-types-bundler && npm link`
- run `npm run dev -w @grafana/plugin-types-bundler` to begin development
- after making changes you can test them in terminal by running `plugin-types-bundler --entry-point ./src/types.ts` from the root of your grafana plugin project.
