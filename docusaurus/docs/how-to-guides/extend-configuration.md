---
id: extend-configurations
title: Extend default configurations
description: Extend your development environment tooling configuration (webpack, eslint, prettier, jest, Playwright)
keywords:
  - grafana
  - plugins
  - plugin
  - frontend
  - tooling
  - configuration
  - webpack
  - playwright
---

The `.config/` directory holds the preferred configuration for the different tools used to develop, test, and build a Grafana plugin. Although you can make changes, we recommend against doing so. Instead, follow the guidance in this topic to customize your tooling configs.

:::danger

Do not edit files in the `.config/` directory. The create-plugin `update` command overwrites any changes in this directory. Editing these files can cause your plugin to fail to compile or load in Grafana.

Instead of changing the files directly, follow the instructions on this page to make advanced configurations.

:::

The configuration files in the project root import the `.config/` files by package name, for example `@grafana/create-plugin-configs/jest`. `.config/` is a workspace package with this name, so the same imports work in a single plugin and in a [plugin monorepo](./monorepos.md). Plugins scaffolded with an earlier version of `create-plugin` import the files by relative path instead, for example `./.config/jest.config`, which keeps working.

### Extend the ESLint config

Edit the `eslint.config.mjs` file in the project root to extend the ESLint configuration. The following example disables deprecation notices for source files.

**Example:**

```javascript title="eslint.config.mjs"
import { defineConfig } from 'eslint/config';
import baseConfig from '@grafana/create-plugin-configs/eslint';

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
  "extends": "@grafana/create-plugin-configs/tsconfig.json",
  "compilerOptions": {
    "preserveConstEnums": true
  }
}
```

### Extend the Playwright config

Edit the `playwright.config.ts` file in the project root to extend the Playwright configuration. The following example adds a Firefox project while retaining the default authentication and Chromium projects:

```ts title="playwright.config.ts"
import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig, devices } from '@playwright/test';
import baseConfig from '@grafana/create-plugin-configs/playwright';

export default defineConfig<PluginOptions>(baseConfig, {
  projects: [
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});
```

### Extend the Webpack config

Edit the `webpack.config.ts` file in the project root to extend the Webpack configuration that lives in `.config/`. The `build` and `dev` scripts use this file.

If your plugin doesn't have a `webpack.config.ts` file in the project root, create one, then update the `build` and `dev` scripts in `package.json` to use it:

```diff title="package.json"
-"build": "webpack -c ./.config/webpack/webpack.config.ts --env production",
+"build": "webpack -c ./webpack.config.ts --env production",
-"dev": "webpack -w -c ./.config/webpack/webpack.config.ts --env development",
+"dev": "webpack -w -c ./webpack.config.ts --env development",
```

Use the [webpack-merge](https://github.com/survivejs/webpack-merge) package to extend the `create-plugin` configuration:

```ts title="webpack.config.ts"
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig, { Env } from '@grafana/create-plugin-configs/webpack';
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

#### Custom Webpack config examples

The following example excludes a "libs" directory from typescript/javascript compilation preventing build or runtime failures when importing bundled libraries directly in source code.

```ts title="webpack.config.ts"
import type { Configuration } from 'webpack';
import { mergeWithRules } from 'webpack-merge';
import grafanaConfig, { Env } from '@grafana/create-plugin-configs/webpack';

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
import grafanaConfig, { Env } from '@grafana/create-plugin-configs/webpack';

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
