---
id: advanced-configuration
title: Advanced Configuration
---

The `.config/` directory holds the preferred configuration for the different tools used to develop, test and build a plugin.

:::danger

To make future updates easier do **not** edit files in the `.config` directory. Instead follow the directions in this article to customise the tooling configurations.

:::

## How to extend the configs?

Note that you are doing this at your own risk. Extending any of the basic configuration can lead to issues at build and runtime.

### Extend the ESLint config

Edit the `.eslintrc` file in the project root to extend the ESLint configuration.

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

### Extend the Prettier config

Edit the `.prettierrc.js` file in the project root to extend the Prettier configuration.

**Example:**

```javascript
module.exports = {
  // Prettier configuration provided by @grafana/create-plugin
  ...require('./.config/.prettierrc.js'),
  semi: false,
};
```

---

### Extend the Jest config

There are two files in the project root that belong to Jest: `jest-setup.js` and `jest.config.js`.

**`jest-setup.js`:** Is run before each test file in the suite is executed. It will set up Jest DOM for the testing library and apply some polyfills. ([link to Jest docs](https://jestjs.io/docs/configuration#setupfilesafterenv-array))

**`jest.config.js`:** The Jest config file that extends the Grafana config. ([link to Jest docs](https://jestjs.io/docs/configuration))

#### ESM errors with Jest

A common issue with the current jest config involves importing an npm package which only offers an ESM build. These packages cause jest to error with `SyntaxError: Cannot use import statement outside a module`. To work around this we provide a list of known packages to pass to the `[transformIgnorePatterns](https://jestjs.io/docs/configuration#transformignorepatterns-arraystring)` jest configuration property. This can be extended in the following way:

```javascript
process.env.TZ = 'UTC';
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by @grafana/create-plugin
  ...require('./.config/jest.config'),
  // Inform jest to only transform specific node_module packages.
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, 'packageName'])],
};
```

---

### Extend the TypeScript config

Edit the `tsconfig.json` file in the project root in order to extend the TypeScript configuration.

**Example:**

```json
{
  // Typescript configuration provided by @grafana/create-plugin
  "extends": "./.config/tsconfig.json",
  "compilerOptions": {
    "preserveConstEnums": true
  }
}
```

---

### Extend the Webpack config

Follow these steps to extend the Webpack configuration that lives in `.config/`:

#### 1. Create a new Webpack configuration file

Create a `webpack.config.ts` file in the project root. This will extend the webpack config provided by @grafana/create-plugin.

#### 2. Merge the Grafana config with your custom config

Use [webpack-merge](https://github.com/survivejs/webpack-merge) for this.

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

#### 3. Update the `package.json` to use the new Webpack config

Update the `scripts` in the `package.json` to use the extended Webpack configuration.

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
