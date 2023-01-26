---
id: migrating-from-toolkit
title: Migrating from Grafana Toolkit
---

If you were using `@grafana/toolkit` to scaffold and develop plugins this guide should help you make the jump to plugin tools.

Plugin tools consists of two packages:

- `create-plugin` is a command-line utility to scaffold new plugins or migrate plugins created with `@grafana/toolkit`.
- `sign-plugin` is a command-line utility to sign plugins for distribution.

:::warning
Before running the following command we strongly suggest backing up the code. Ideally make sure the plugin is stored in a git repository and the command is run on a clean branch to easily identify changes made by the migration command.
:::

## Migrate your plugin to create-plugin

To get started, in the root directory of the existing plugin (where the `package.json` file is) run the following command and answer the prompts.

```
npx @grafana/create-plugin migrate
```

## Prompts

When running the migrate command the following prompts will appear asking for confirmation before making changes. Due to their destructive nature the default for each of the following prompts is `no`.

### The following files will be overriden. Would you like to continue?

Selecting `y` will create/replace the following files/folders in the plugin directory:

```
myplugin-directory/
├── .config/
├── .eslintrc
├── .nvmrc
├── .prettierrc.js
├── docker-compose.yaml
├── jest-setup.js
├── jest.config.js
└── tsconfig.json
```

### The following files are required. Can we scaffold them for you?

Selecting `y` will make sure a `CHANGELOG.md` file exists in the plugin directory.

### The following files are possibly not needed anymore. Are you ok with us removing them?

Selecting `y` will delete the following files/folders in the plugin directory:

```
myplugin-directory/
├── Dockerfile
├── docker-compose.yml
├── webpack/
├── .webpack/
└── .prettierrc
```

### Would you like to update the following dependencies in the package.json?

Selecting `y` will update all the npm dependencies listed by the prompt. The command purposely avoids updating `@grafana` npm dependencies to reduce the friction with migration.

### Would you like to remove the following possibly unnecessary NPM dependencies?

Selecting `y` will delete the following npm dependencies found in `package.json`:

```diff json
{
  "devDependencies": {
-   "ts-loader": "*",
-   "babel-loader": "*",
-   "@grafana/toolkit": "*"
  }
}
```

### Would you like to update the scripts in your package.json? All scripts using grafana-toolkit will be replaced.

This step will update any npm scripts in the `package.json` file to match the latest configurations. Any scripts that were previously using `grafana-toolkit` will be replaced.

## Next steps

Once the command has finished the migration we recommend looking at the changes introduced and then running each of the npm scripts inside `package.json` to confirm the plugin can be built, tested, signed etc.

For help with resolving issues we recommend reaching out on [slack](https://grafana.slack.com/) or the [community forum](https://community.grafana.com/c/plugin-development/30).
