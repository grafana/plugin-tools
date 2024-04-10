# Grafana / Plugin Meta Extractor

`@grafana/plugin-meta-extractor` is a small package that can be used to extract meta-information from the source code of a Grafana plugin. The main use case is to be able to automatically generate static information for a plugin without needing to manually edit the meta-info files (which might get forgotten).

## Install

```
npm install @grafana/plugin-meta-extractor
```

### Usage

#### With Webpack

The package exposes a webpack plugin that can be used to generate plugin meta-information on every build based on the source code.

```ts
// webpack.config.ts
// -----------------

import { GrafanaPluginMetaExtractor } from '@grafana/plugin-meta-extractor';

export default {
  // ...
  plugins: [
    // Creates a "plugin.generated.json" file in the output directory
    // `entryFile` - an absolute path pointing to the module.(ts|tsx) file of your plugin
    new GrafanaPluginMetaExtractor({ entryFile: '...' }),
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

### Returned data format

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

### Plugin support

At this point the tool requires the `module.(ts|tsx)` to be in a certain format to be able to parse it (we are planning to improve on this in the future).

The method calls for registering extensions have to be in the `module.(ts|tsx)`, and they need to be called on the `AppPlugin` instance in a "chained" manner:

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

### Contributing

We are always grateful for contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.
