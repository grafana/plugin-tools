# Default build configuration by Grafana

**This is a auto-generated directory and is not intended to be changed! ⚠️**

The `.config/` directory holds basic configuration for the different tools
that are used to develop, test and build the project. In order to make it updates easier we ask you to
not edit files in this folder to extend configuration.

## How to extend the basic tooling configs?

Bear in mind that you are doing it at your own risk, and that extending any of the basic configuration can lead
to issues around working with the project.

### Extending the ESLint config

Edit the `.eslintrc` file in the project root in order to extend the ESLint configuration.

**Example:**
```json
{
  "extends": "./.config/.eslintrc",
  "rules": {
      "react/prop-types": "off"
  }
}
```

---

### Extending the Prettier config

Edit the `.prettierrc.js` file in the project root in order to extend the Prettier configuration.

**Example:**
```javascript
module.exports = {
  // Prettier configuration provided by Grafana scaffolding
  ...require("./.config/.prettierrc.js"),

  semi: false,
};
```

---

### Extending the Jest config

There are two configuration in the project root that belong to Jest: `jest-setup.js` and `jest.config.js`.

**`jest-setup.js`:** A file that is run before each test file in the suite is executed. We are using it to
set up the Jest DOM for the testing library and to apply some polyfills. ([link to Jest docs](https://jestjs.io/docs/configuration#setupfilesafterenv-array))

**`jest.config.js`:** The main Jest configuration file that is extending our basic Grafana-tailored setup. ([link to Jest docs](https://jestjs.io/docs/configuration))

---

### Extending the TypeScript config

Edit the `tsconfig.json` file in the project root in order to extend the TypeScript configuration.

**Example:**
```json
{
  "extends": "./.config/tsconfig.json",
  "compilerOptions": {
    "preserveConstEnums": true
  }
}
```

---

### Extending the Webpack config

Follow these steps to extend the basic Webpack configuration that lives under `.config/`:

1. Create a new Webpack configuration file in the project root, e.g. `webpack.config.ts`

2. Use `webpack-merge` to merge the basic config provided by Grafana and your custom setup:
```typescript
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';

const config = (env) =>
    merge(grafanaConfig(env), {
        output: {
            // Add custom config here...
            asyncChunks: true,
        },
    });

export default config;
```

3. Update the `package.json` to use the new Webpack config

**`$ yarn build`**
```diff
+"build": "TS_NODE_PROJECT=\"./.config/webpack/tsconfig.webpack.json\" webpack -c ./.config/webpack/webpack.config.ts --env production",
-"build": "TS_NODE_PROJECT=\"./.config/webpack/tsconfig.webpack.json\" webpack -c ./webpack.config.ts --env production",
```

**`$ yarn dev`**
```diff
+"dev": "TS_NODE_PROJECT=\"./.config/webpack/tsconfig.webpack.json\" webpack -w -c ./.config/webpack/webpack.config.ts --env development",
-"dev": "TS_NODE_PROJECT=\"./.config/webpack/tsconfig.webpack.json\" webpack -w -c ./webpack.config.ts --env development",
```
