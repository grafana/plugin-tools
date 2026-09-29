# Migrate the plugin's custom build configuration to rspack

## Context

This plugin is moving its frontend build to rspack 2. The `create-plugin add rspack` codemod has already done the parts that create-plugin owns:

- Rendered the rspack base config in `.config/rspack/` and the shared helpers in `.config/bundler/`, and set `useExperimentalRspack` in `.config/.cprc.json`.
- Deleted the create-plugin files in `.config/webpack/`. It kept any file there that the plugin added and listed it in its output.
- Added the rspack packages (`@rspack/core`, `@rspack/cli`, `rspack-merge`, `eslint-rspack-plugin` and others) and removed webpack-only packages. It kept any webpack package that a root `webpack.*` or `rspack.*` file still imports and listed it.
- Rewrote `webpack` commands in `package.json` scripts to `rspack`. It listed any script it could not rewrite.
- If the plugin has a root `webpack.config.*`, added a root `rspack.config.ts` that throws an `[rspack]` error until the custom config is ported.
- Raised `engines.node` to `>=22.23` if it allowed older versions.

What is left is the plugin's own build customisation, which needs judgement to port. The previous base config is still in git: `git show HEAD:.config/webpack/webpack.config.ts`. Compare it with `.config/rspack/rspack.config.ts` when you need to know how a base rule or plugin changed.

## Check first

1. Install dependencies with the plugin's package manager, then run the `build` script. Keep the output; it is evidence, not a to-do list.
2. Stop and report that nothing was needed if all of these are true:
   - The build passes.
   - There is no root `webpack.config.*` file.
   - Root `rspack.config.ts`, if present, does not contain the `[rspack]` error.
   - No script in `package.json` calls `webpack`.
3. Otherwise, work out the starting point:
   - **From webpack**: there is a root `webpack.config.*`, or `rspack.config.ts` contains the `[rspack]` error. Follow all the steps below.
   - **From experimental rspack**: there is a root `rspack.config.ts` without the `[rspack]` error, and there is no root `webpack.config.*`. The config is already rspack but may use rspack 1 APIs. Skip step 2 and upgrade that file in place using steps 3 to 5.

With a custom config, the build is expected to fail at this point with the `[rspack]` error. Do not chase build errors one by one; the steps below drive the work.

## Steps

1. Find every file that is part of the custom build: the root `webpack.config.*`, any file it imports (for example `webpack.config.utils.ts`), and any file the codemod reported as kept in `.config/webpack/`.

2. Replace the body of root `rspack.config.ts` with a port of the root webpack config:
   - Import the base config with `import grafanaConfig, { type Env } from './.config/rspack/rspack.config.ts';`.
   - Merge with `rspack-merge` (`merge`, `mergeWithRules`, `mergeWithCustomize`, `unique`). It has the same API as `webpack-merge`, typed for rspack. Await the base config before merging.
   - Keep the structure, comments and behaviour of the original. Port it; do not improve it.
   - Remove the `[rspack]` error and the `TODO(rspack)` comment above it only when the port is complete.

3. Replace webpack APIs and packages with their rspack equivalents. Import from `@rspack/core` with named imports, for example `import { DefinePlugin, NormalModuleReplacementPlugin } from '@rspack/core';`.

   | webpack                                                                                                                                                                          | rspack                                                                      |
   | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
   | `webpack` built-in plugins (`DefinePlugin`, `EnvironmentPlugin`, `BannerPlugin`, `ProvidePlugin`, `NormalModuleReplacementPlugin`, `ContextReplacementPlugin`) and `Compilation` | the same names from `@rspack/core`                                          |
   | `webpack-merge`                                                                                                                                                                  | `rspack-merge`                                                              |
   | `copy-webpack-plugin`                                                                                                                                                            | `CopyRspackPlugin` from `@rspack/core`                                      |
   | `swc-loader`, `babel-loader`                                                                                                                                                     | `builtin:swc-loader`                                                        |
   | `fork-ts-checker-webpack-plugin`                                                                                                                                                 | `TsCheckerRspackPlugin` from `ts-checker-rspack-plugin`                     |
   | `eslint-webpack-plugin`                                                                                                                                                          | `eslint-rspack-plugin` (it has no `failOnError`; use `severity`)            |
   | `webpack-livereload-plugin`                                                                                                                                                      | already in the base config for development builds                           |
   | `mini-css-extract-plugin`                                                                                                                                                        | `CssExtractRspackPlugin` from `@rspack/core`                                |
   | `css-minimizer-webpack-plugin`                                                                                                                                                   | `LightningCssMinimizerRspackPlugin` from `@rspack/core`                     |
   | `terser-webpack-plugin` added by the plugin                                                                                                                                      | `SwcJsMinimizerRspackPlugin` from `@rspack/core`, or keep terser            |
   | `html-webpack-plugin`                                                                                                                                                            | `HtmlRspackPlugin` from `@rspack/core`                                      |
   | `tsconfig-paths-webpack-plugin`                                                                                                                                                  | the `resolve.tsConfig` option                                               |
   | `file-loader`, `url-loader`, `raw-loader`                                                                                                                                        | asset modules: `type: 'asset/resource'`, `'asset/inline'`, `'asset/source'` |
   | plugins built on unplugin (`x/webpack`)                                                                                                                                          | the `x/rspack` entry point, where one exists                                |
   | imports from `.config/webpack/utils` or `.config/webpack/constants`                                                                                                              | `.config/bundler/utils.ts` and `.config/bundler/constants.ts`               |

   Check the [rspack migration guide](https://rspack.rs/guide/migration/webpack) for anything not listed here.

4. Fix code that depends on how the base config is built. Each of these works in webpack and silently does nothing, or throws, in rspack:
   - **Looking up a rule by loader name**, such as `rule.use.loader === 'swc-loader'`. The base config uses `builtin:swc-loader`, so match that. Prefer merging a rule over mutating the base one.
   - **Looking up a plugin with `instanceof` or `constructor.name`** against webpack plugin classes, such as `CopyWebpackPlugin` or `LiveReloadPlugin`. Use the rspack class names, or merge instead of mutating.
   - **`webpack-merge` rules keyed on old names**: `unique('plugins', ['CopyPlugin'], …)` or `mergeWithRules` matching `use.loader: 'swc-loader'`. Update the names.
   - **A `filter` function on a `CopyWebpackPlugin` pattern**. `CopyRspackPlugin` has no `filter`; use `globOptions: { ignore: [...] }`. The base copy patterns come from `.config/bundler/copyFiles.ts`.
   - **Removing the live reload plugin by filtering the plugins array**. The rspack base only adds it in development; filter on the rspack plugin class.
   - **Native ESM loading**: the rspack CLI loads `rspack.config.ts` as native ESM. Replace `__dirname` with `import.meta.dirname`, `require.resolve(x)` with `createRequire(import.meta.url).resolve(x)`, and `require(x)` with `import`. Give relative imports explicit `.ts` extensions. `ReferenceError: __dirname is not defined` at build time means this step is not done.
   - **rspack 2 defaults**: imports of exports that do not exist now fail the build (`exportsPresence: 'error'`). Fix the import in the plugin's code if it is clearly wrong; otherwise report it rather than changing the setting.
   - **rspack 2 option moves**: `experiments.cache`, `experiments.incremental` and `experiments.lazyCompilation` are now top level. `experiments.css` is replaced by `module.rules[].type: 'css' | 'css/module' | 'css/auto'`. `experiments.outputModule` is `output.module`. `output.libraryTarget`, `libraryExport` and `umdNamedDefine` move under `output.library`. `SubresourceIntegrityPlugin` is no longer under `experiments`.
   - **Persistent cache**: the base config has none. If the webpack config set `cache.type: 'filesystem'`, drop it unless the plugin clearly needs it.

5. If something has no rspack equivalent, for example a monkey-patch of webpack internals, a custom `RuntimeModule` plugin, or an SWC Wasm plugin whose ABI does not match rspack's built-in SWC:
   - Port what you can.
   - Comment out the rest, keeping the original code in the comment, so it does not run and the build does not fail.
   - Put a `TODO(rspack):` comment above it that says what the code did, why it has no direct equivalent, and a suggested approach.
   - Never drop it silently.

6. Fix any script the codemod reported as not rewritten so it calls `rspack` with `./rspack.config.ts` or `./.config/rspack/rspack.config.ts`, keeping its other commands and flags. Remove the CLI flags rspack does not support: `--progress`, `--color`, `--bail`, `--output-pathinfo`.

7. For each file the codemod kept in `.config/webpack/`, copy what is still needed to a folder outside `.config/` (for example `build/`), port it to rspack, and update the imports. Do not delete the originals; list them so the user can delete them.

8. Remove the webpack packages the codemod kept, once nothing imports them. Keep `webpack` itself if anything still imports it.

9. Delete the root `webpack.config.*` and its helper files once everything in them is ported or commented with `TODO(rspack):`.

## Verify

1. Install dependencies, then run the `typecheck` and `build` scripts. Both must pass, with any unportable code commented out.
2. Check that `dist/` contains `module.js`, `plugin.json`, and the images and other assets the webpack build produced.
3. Run the `dev` script briefly and check that it compiles and keeps watching.
4. Fix only breakage caused by this migration.

## Report

End with a list of every `TODO(rspack):` comment you added (file, line, one-line reason), every file the user should delete, and any `exportsPresence` errors you left for the user.

## Out of scope

- Do not modify anything under `.config/`. It is managed by create-plugin and is overwritten by `create-plugin update`.
- Do not change the plugin id or type in `src/plugin.json`.
- Do not upgrade unrelated dependencies, and do not reformat files you did not change.
- Do not refactor plugin source code, unless the build fails because of the bundler change.
