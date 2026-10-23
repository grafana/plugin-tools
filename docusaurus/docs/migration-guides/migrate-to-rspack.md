---
id: migrate-to-rspack
title: Migrate from webpack to Rspack
description: Move the frontend build of a Grafana plugin created with create-plugin from webpack, or from the experimental Rspack setup, to Rspack 2 with the rspack addition.
keywords:
  - grafana
  - plugins
  - plugin
  - rspack
  - webpack
  - create-plugin
  - migration
---

import AddRspackNPM from '@shared/createplugin-add-rspack.md';

# Migrate from webpack to Rspack

This guide explains how to move the frontend build of your plugin from webpack to [Rspack](https://rspack.rs) 2 with the `rspack` addition of the `create-plugin` tool. It also applies to plugins that use the experimental Rspack setup from earlier versions of `create-plugin`.

## Before you begin

- Commit or stash your changes. The `add` command stops if the repository has uncommitted changes.
- Use Node.js 22.23 or later. The migration raises `engines.node` in your `package.json` file to `>=22.23` if it allows an older version.
- Check whether your plugin extends the build configuration with a `webpack.config.*` or `rspack.config.*` file in the project root. If it does, you port that file as part of the migration.

## Run the migration

From the root of your plugin, run the `rspack` addition:

<AddRspackNPM />

If you have a supported AI agent CLI installed, `create-plugin` offers to use it to port a custom build configuration. To make the changes yourself, add the `--no-agent` flag. To learn how the `add` command and agents work, refer to [Add features to your plugin](../how-to-guides/add-features-to-a-plugin.md).

## What changes in your project

The migration changes these files:

- `.config/rspack/`: adds the Rspack base configuration.
- `.config/webpack/`: removes the files that `create-plugin` added. The migration keeps any files of your own in this folder and lists them in the command output.
- `.config/bundler/`: updates the helpers that the base configuration uses.
- `package.json`:
  - Adds the Rspack packages and removes the packages that only the webpack base configuration used. A package stays if a `webpack.*` or `rspack.*` file in the project root still imports it. The `webpack` package always stays, because loaders in the Rspack base configuration depend on it.
  - Replaces `webpack` with `rspack` in your scripts. The command output lists any script it can't rewrite.
  - Raises `engines.node` to `>=22.23`, if it allows an older version.
- `.config/.cprc.json`: sets the `useRspack` feature flag, so that later `create-plugin update` runs treat your plugin as an Rspack plugin.

## Port a custom build configuration

If your plugin has a `webpack.config.*` file in the project root, the migration adds an `rspack.config.ts` file that stops the build with an error like this:

```text
[rspack] webpack.config.ts has not been ported to rspack.config.ts yet.
```

The error prevents you from releasing a build without your customizations. If an agent applied the addition, it has already replaced this file. Otherwise, port your configuration:

1. Merge your customizations into the base configuration in `rspack.config.ts` with [`rspack-merge`](https://github.com/rstackjs/rspack-merge):

   ```ts title="rspack.config.ts"
   import type { Configuration } from '@rspack/core';
   import { merge } from 'rspack-merge';
   import grafanaConfig, { type Env } from './.config/rspack/rspack.config.ts';

   const config = async (env: Env): Promise<Configuration> => {
     const baseConfig = await grafanaConfig(env);

     return merge(baseConfig, {
       // your customizations
     });
   };

   export default config;
   ```

1. Replace webpack plugins and loaders with their Rspack equivalents. For example, replace `copy-webpack-plugin` with `CopyRspackPlugin` from `@rspack/core`. For the full list, refer to [Migrate from webpack](https://rspack.rs/guide/migration/webpack) in the Rspack documentation.
1. Make the file work as a native ECMAScript module (ESM), because the Rspack CLI loads it that way. Replace `__dirname` with `import.meta.dirname` and `require()` with `import`, and add the `.ts` extension to relative imports.
1. Comment out any code that has no Rspack equivalent, and add a `TODO(rspack):` comment that explains what the code did.
1. Remove the `[rspack]` error.
1. Delete the `webpack.config.*` file and any files that only it imports.

If you use the `--no-agent` flag, the command prints the path to the instructions file that an agent follows. It covers more cases than this guide, such as plugins that look up base rules by loader name.

## Migrate from the experimental Rspack setup

The migration replaces the files in `.config/rspack/` with the Rspack 2 base configuration and upgrades the Rspack packages. It doesn't change the `rspack.config.ts` file in your project root. Update that file for the changes listed in [Migrate from Rspack 1.x](https://rspack.rs/guide/migration/rspack_1.x), and replace `webpack-merge` with `rspack-merge`.

If you run `create-plugin update` before you run the `rspack` addition, it renames the `useExperimentalRspack` feature flag to `useRspack`. It doesn't change your Rspack configuration.

## Check the result

Run your checks and start the development build:

```shell npm2yarn
npm run typecheck
npm run build
npm run dev
```

If `create-plugin` started an agent, it has already run the `typecheck` and `build` scripts.

After the build, check that `dist/` contains `module.js`, `plugin.json`, and any file that your plugin refers to by path at runtime.

## Troubleshooting

### The build fails with an `[rspack]` error

The build configuration in your project root isn't ported yet. Refer to [Port a custom build configuration](#port-a-custom-build-configuration).

### `ReferenceError: __dirname is not defined`

`rspack.config.ts`, or a file it imports, uses a CommonJS global. Replace `__dirname` with `import.meta.dirname`.

### The build fails because an export doesn't exist

Rspack 2 stops the build when code imports a name that a module doesn't export. In webpack, this was a warning. Fix the import in your code.

### A file returns 404 at runtime

Base configurations from older versions of `create-plugin` copied images, SVG and HTML files, and the `img/`, `libs/` and `static/` folders, into `dist/`. The current base configuration copies only `plugin.json` and other JSON files, the README, CHANGELOG and LICENSE files, `query_help.md`, and the logos and screenshots that `plugin.json` lists. If you created your plugin with an older version, the migration brings in this change.

If your code builds a URL to any other file, import the file and use the imported URL instead:

```tsx
import howItWorks from '../img/how-it-works.svg';

export const HowItWorks = () => <img src={howItWorks} alt="How it works" />;
```

If your code builds the path at runtime, add a `CopyRspackPlugin` to `rspack.config.ts` for those files.

## Next steps

- To extend the Rspack configuration later, follow the steps in the `.config/README.md` file of your plugin.
- To learn more about additions and the `add` command, refer to [Add features to your plugin](../how-to-guides/add-features-to-a-plugin.md).
