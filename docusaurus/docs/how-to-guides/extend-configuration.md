---
id: extend-configurations
title: Extend default configurations
description: Extend your development environment tooling configuration (webpack, eslint, prettier, jest)
keywords:
  - grafana
  - plugins
  - plugin
  - frontend
  - tooling
  - configuration
  - webpack
---

The `.config/` directory holds the preferred configuration for the different tools used to develop, test, and build a Grafana plugin. Although you can make changes, we recommend against doing so. Instead, follow the guidance in this topic to customize your tooling configs.

:::danger

Do not edit files in the `.config/` directory. The create-plugin `update` command overwrites any changes in this directory. Editing these files can cause your plugin to fail to compile or load in Grafana.

Instead of changing the files directly, follow the instructions on this page to make advanced configurations.

:::

### Extend the ESLint config

Edit the `eslint.config.mjs` file in the project root to extend the ESLint configuration. The following example disables deprecation notices for source files.

**Example:**

```javascript title="eslint.config.mjs"
import { defineConfig } from 'eslint/config';
import baseConfig from './.config/eslint.config.mjs';

export default defineConfig([
  {
    ignores: [
      //...
    ],
  },
  ...baseConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
]);
```

### Extend the Prettier config

Edit the `.prettierrc.js` file in the project root to extend the Prettier configuration:

**Example:**

```js title=".prettierrc.js"
module.exports = {
  // Prettier configuration provided by @grafana/create-plugin
  ...require('./.config/.prettierrc.js'),
  semi: false,
};
```

### Extend the Jest config

There are two files in the project root that belong to Jest: `jest-setup.js` and `jest.config.js`.

**`jest-setup.js`:** This file is run before each test file in the suite is executed. It sets up Jest DOM for the testing library and applies some polyfills. For more information, refer to the [Jest documentation](https://jestjs.io/docs/configuration#setupfilesafterenv-array).

**`jest.config.js`:** This is the Jest config file that extends the Grafana config. For more information, refer to the [Jest configuration documentation](https://jestjs.io/docs/configuration).

#### ESM errors with Jest

If you see `SyntaxError: Cannot use import statement outside a module` when running Jest or `npm run test` see [Troubleshooting](/troubleshooting#i-get-syntaxerror-cannot-use-import-statement-outside-a-module-when-running-jest-or-npm-run-test).

### Extend the TypeScript config

To extend the TS configuration, edit the `tsconfig.json` file in the project root:

**Example:**

```json title="tsconfig.json"
{
  // TypeScript configuration provided by @grafana/create-plugin
  "extends": "./.config/tsconfig.json",
  "compilerOptions": {
    "preserveConstEnums": true
  }
}
```

### Extend the Webpack config

Follow these steps to extend the Webpack configuration that lives in `.config/`:

#### 1. Create a new Webpack configuration file

Create a `webpack.config.ts` file in the project root. This file extends the Webpack config provided by `create-plugin`.

#### 2. Merge the Grafana config with your custom config

Use the [webpack-merge](https://github.com/survivejs/webpack-merge) package to extend the `create-plugin` configuration:

```ts title="webpack.config.ts"
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig, { Env } from './.config/webpack/webpack.config';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {
    // Adds a webpack plugin to the configuration
    plugins: [new BundleAnalyzerPlugin()],
  });
};

export default config;
```

#### 3. Update the `package.json` to use the new Webpack config

Update the `scripts` in the `package.json` to use the extended Webpack configuration:

```diff title="package.json"
-"build": "webpack -c ./.config/webpack/webpack.config.ts --env production",
+"build": "webpack -c ./webpack.config.ts --env production",
-"dev": "webpack -w -c ./.config/webpack/webpack.config.ts --env development",
+"dev": "webpack -w -c ./webpack.config.ts --env development",
```

#### Custom Webpack config examples

The following example excludes a "libs" directory from typescript/javascript compilation preventing build or runtime failures when importing bundled libraries directly in source code.

```ts title="webpack.config.ts"
import type { Configuration } from 'webpack';
import { mergeWithRules } from 'webpack-merge';
import grafanaConfig, { Env } from './.config/webpack/webpack.config';

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  const customConfig = {
    module: {
      rules: [
        {
          exclude: /(node_modules|libs)/,
          test: /\.[tj]sx?$/,
        },
      ],
    },
  };
  return mergeWithRules({
    module: {
      rules: {
        exclude: 'replace',
      },
    },
  })(baseConfig, customConfig);
};

export default config;
```

Webpack 5 does not polyfill [Node.js core modules](https://webpack.js.org/configuration/resolve/#resolvefallback) automatically. The following example shows how to add Node.js polyfills should your plugin make use of them.

```ts title="webpack.config.ts"
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig, { Env } from './.config/webpack/webpack.config';

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {
    resolve: {
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        fs: false,
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
      },
    },
  });
};

export default config;
```
