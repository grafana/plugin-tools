# Grafana / Eslint Config

> Grafana's [ESLint](https://eslint.org) config.

## Installation

```shell
npm install @grafana/eslint-config --save-dev
```

Don't forget to install peerDependencies.

1. Install the correct versions of each package, which are listed by the command:

```sh
npm info "@grafana/eslint-config@latest" peerDependencies
```

If using a different package manager, run `npm info "@grafana/eslint-config@latest" peerDependencies` to list the peer dependencies and versions. Then run `yarn add --dev <dependency1>@<version> <dependency2>@<version> <dependency3>@<version>` for the listed peer dependencies.

## Configuration

From v8.21.0, Eslint introduced a new flat config system where `eslint.config.js` replaces `.eslintrc*` as the default config file name. Eslint@8.x supports both systems, while Eslint@9.x only supports the new flat config.

A guide on how to migrate to a flat config can be found [here](https://eslint.org/docs/latest/extend/plugin-migration-flat-config).

The following official blog posts are available for interested parties:

- https://eslint.org/blog/2022/08/new-config-system-part-1/
- https://eslint.org/blog/2022/08/new-config-system-part-2/
- https://eslint.org/blog/2022/08/new-config-system-part-3/

This package contains a single flat config object.

```js
import grafanaConfig from "@grafana/eslint-config";

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
export default [
  ...grafanaConfig,
  … /* rest of your config */
];
```

You are then free to add/override properties.

Note: Our shareable configs does not preconfigure `files`, `ignore`, or `languageOptions.globals`. For most of the cases, you probably want to configure some properties for your project.

```js
import grafanaConfig from '@grafana/eslint-config';

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
export default [
  {
    ignores: ['.github', '.yarn', '**/build/', '**/compiled/', '**/dist/'],
  },
  ...grafanaConfig,
  {
    name: 'myproject/defaults',
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      // add custom rules here.
    },
  },
];
```
