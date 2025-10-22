# eslint-plugin-plugins

`eslint-plugin-plugins` contains an ESLint rule that checks whether imports from any of the Grafana packages (`@grafana/ui`, `@grafana/data` and `@grafana/runtime`) from within a Grafana plugin source code exist in all the Grafana runtimes that the plugin is supposed to support (as specified in the `grafanaDependency` in `plugin.json`).

## How to install

```shell
npm install @grafana/eslint-plugin-plugins --save-dev
```

### Configure

To determine the plugin's minimum supported Grafana version, the linter checks the `grafanaDependency` property in the plugin's `plugin.json`. By default, it looks for `plugin.json` in the `<projectRoot>/src` folder. If the file is located elsewhere or if you're using a monorepo with multiple plugins that have different `grafanaDependency` values, you can specify `minGrafanaVersion` directly in the ESLint configuration.

#### Flat config

```js
const grafanaPlugins = require('@grafana/eslint-plugin-plugins');

module.exports = [
  // ...other configs
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { '@grafana/plugins': grafanaPlugins },
    rules: {
      '@grafana/plugins/import-is-compatible': [
        'warn',
        // optionally pass the minimum supported version
        // { minGrafanaVersion: '10.3.0' },
      ],
    },
  },
];
```

#### Legacy config

Add the following to your Grafana plugin's `.eslintrc`:

```js
{
  ...
  "plugins": ["@grafana/eslint-plugin-plugins"],
  "rules": {
    "@grafana/plugins/import-is-compatible": [
      "warn"
      // optionally pass the minimum supported version
      // { minGrafanaVersion: '10.3.0' },
    ]
  }
}
```

### Lint

```shell
npm run lint
```

If your IDE has an ESlint integration that displays errors and warning in the source code, you may need to restart the ESlint server. In VSCode you can run the task `ESLint: Restart ESlint Server`.

## How it works

When the ESlint plugin is loaded the first time, it will check the `grafanaDependency` property in the Grafana plugin's `plugin.json` file to find the min supported Grafana version. If for example the `grafanaDependency` is set to `>=10.0.2`, `@grafana/ui@10.0.2`, `@grafana/data@10.0.2` and `@grafana/runtime@10.0.2` will be downloaded to a temp directory on the host machine. It will then check that imports from any of these packages within the plugin source code has a corresponding export in version `10.0.2` of these packages. If not, a problem is reported. It currently ignores member that don't exist at runtime such as types, interfaces and enums.

The `import-is-compatible` rule only checks backwards compatibility. If a member has been removed in an upcoming release of the Grafana packages, it will not be detected.

## Contributing

Refer to the [contributing guidelines](./CONTRIBUTING.md).

### Rules

| Name                 | Description                                                                                                          |
| :------------------- | :------------------------------------------------------------------------------------------------------------------- |
| import-is-compatible | A rule that checks if the imported member is available in all Grafana runtime environments that the plugin supports. |
