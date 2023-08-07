---
id: extend-configurations
title: Extend configurations
sidebar_position: 10
description: Advanced configurations of Grafana plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - advanced
  - configuration
---

The `.config/` directory holds the preferred configuration for the different tools used to develop, test, and build a Grafana plugin. Although you can make changes, we recommend against doing so. Instead, follow the guidance in this topic to customize your tooling configs.

:::danger

Do not edit the `.config/` directory or extend the tooling configurations. If you attempt to do so, then you may experience issues such as failure to compile or load in Grafana. Instead of changing the files directly, follow the instructions in this topic to make advanced configurations.

:::

## Extend the ESLint config

Edit the `.eslintrc` file in the project root to extend the ESLint configuration:

**Example:**

```json
{
  // Eslint configuration provided by @grafana/create-plugin
  "extends": "./.config/.eslintrc",
  "rules": {
    "react/prop-types": "off"
  }
}
```

---

## Extend the Prettier config

Edit the `.prettierrc.js` file in the project root to extend the Prettier configuration:

**Example:**

```javascript
module.exports = {
  // Prettier configuration provided by @grafana/create-plugin
  ...require('./.config/.prettierrc.js'),
  semi: false,
};
```

---

## Extend the Jest config

There are two files in the project root that belong to Jest: `jest-setup.js` and `jest.config.js`.

**`jest-setup.js`:** This file is run before each test file in the suite is executed. It sets up Jest DOM for the testing library and applies some polyfills. For more information, refer to the [Jest documentation](https://jestjs.io/docs/configuration#setupfilesafterenv-array).

**`jest.config.js`:** This is the Jest config file that extends the Grafana config. For more information, refer to the [Jest configuration documentation](https://jestjs.io/docs/configuration).

### ESM errors with Jest

A common issue with the current Jest config involves importing an npm package which only offers an ESM build. These packages cause Jest to generate the error: `SyntaxError: Cannot use import statement outside a module`. 

To work around this issue, use one of the packages known to pass to the `[transformIgnorePatterns](https://jestjs.io/docs/configuration#transformignorepatterns-arraystring)` Jest configuration property. 

To use these packages, extend them in the following way:

```javascript
process.env.TZ = 'UTC';
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by @grafana/create-plugin
  ...require('./.config/jest.config'),
  // Inform Jest to only transform specific node_module packages.
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, 'packageName'])],
};
```

---

## Extend the TypeScript config

To extend the TS configuration, edit the `tsconfig.json` file in the project root:

**Example:**

```json
{
  // TypeScript configuration provided by @grafana/create-plugin
  "extends": "./.config/tsconfig.json",
  "compilerOptions": {
    "preserveConstEnums": true
  }
}
```

---

## Extend the Webpack config

Follow these steps to extend the Webpack configuration that lives in `.config/`:

### 1. Create a new Webpack configuration file

Create a `webpack.config.ts` file in the project root. This file extends the Webpack config provided by `create-plugin`.

### 2. Merge the Grafana config with your custom config

Use the following [webpack-merge](https://github.com/survivejs/webpack-merge) command:

```typescript
// webpack.config.ts
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {
    // Add custom config here...
    output: {
      asyncChunks: true,
    },
  });
};

export default config;
```

The following alternative customization excludes "libs" via rules in addition to "node_modules". It also provides fallbacks that are no longer present in Webpack v5.

```typescript
import type { Configuration } from 'webpack';
import { mergeWithRules } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env: any): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  const customConfig = {
    module: {
      rules: [
        {
          exclude: /(node_modules|libs)/,
        },
      ],
    },
    resolve: {
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        fs: false,
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve("util"),
      },
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

### 3. Update the `package.json` to use the new Webpack config

Update the `scripts` in the `package.json` to use the extended Webpack configuration:

**Update `build`:**

```diff
-"build": "webpack -c ./.config/webpack/webpack.config.ts --env production",
+"build": "webpack -c ./webpack.config.ts --env production",
```

**Update `dev`:**

```diff
-"dev": "webpack -w -c ./.config/webpack/webpack.config.ts --env development",
+"dev": "webpack -w -c ./webpack.config.ts --env development",
```
