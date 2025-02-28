# Grafana / Plugin Meta Extractor

> [!WARNING]  
> This is an experimental project and may change at any time. It is not yet used in any of our tools and does not reliably work with most of our app plugin implementation patterns.

`@grafana/plugin-meta-extractor` is a cli tool that can be used to extract meta-information from the source code of a Grafana plugin. It is used to generate plugin metadata without the need for manual intervention, which is then used by the Grafana application to understand features or functionalities a plugin supports or uses.

## Install

```
npm install @grafana/plugin-meta-extractor --save-dev
```

## Usage

#### With Webpack

The package exposes a webpack plugin that can be used to generate plugin meta-information on every build based on the source code. The plugin adds additional information to the `plugin.json` file by overriding the `generated` property in the JSON.

```ts
// webpack.config.ts
// -----------------

import { GrafanaPluginMetaExtractor } from '@grafana/plugin-meta-extractor';

export default {
  // ...
  plugins: [
    new GrafanaPluginMetaExtractor(),
    // ...
  ],
};
```

#### In code

The package exposes the methods for extracting the meta-data so they can be used manually:

```ts
import { extractPluginMeta } from '@grafana/plugin-meta-extractor';

const entryPoint = `${PLUGIN_ROOT}/src/module.ts`;
const pluginMeta = extractPluginMeta(entryPoint);
```

#### CLI

By calling the binary against a (module.ts|tsx) file, the package will print out the extracted meta-data to the console.

```bash
# Run local build
./dist/bin/run.js ~/my-grafana-plugin/src/module.ts

# Run latest remote version
npx @grafana/plugin-meta-extractor ~/my-grafana-plugin/src/module.ts
```

## Returned data format

The returned meta-data is in the following format:

```ts
{
  extensions: Array<{
    type: "link" | "component",
    extensionPointId: string,
    title: string,
    description: string
  }>
}
```

## Plugin support

This package requires the `module.(ts|tsx)` to be in a certain format to be able to parse it (we are planning to improve on this in the future). The method calls for registering extensions have to be in the `module.(ts|tsx)`, and they need to be called on the `AppPlugin` instance in a "chained" manner:

```ts
// src/module.ts
export const plugin = new AppPlugin<{}>()
  .setRootPage(App)
  .configureExtensionLink<PluginExtensionPanelContext>({
    // ...
  })
  .configureExtensionLink<PluginExtensionPanelContext>({
    // ...
  });
```

---

## Contributing

We are always grateful for contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.
