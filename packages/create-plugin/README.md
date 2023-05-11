# Grafana / Create Plugin

Create Grafana plugins with ease.

**ToC**

- [Grafana / Create Plugin](#grafana--create-plugin)
  - [Create a new plugin](#create-a-new-plugin)
    - [Quick overview](#quick-overview)
      - [`npx`](#npx)
      - [`npm`](#npm)
      - [`pnpm`](#pnpm)
      - [`yarn` (1.x)](#yarn-1x)
  - [Migrate your existing plugin](#migrate-your-existing-plugin)
  - [Update your plugin build config](#update-your-plugin-build-config)
  - [Customizing or extending the basic configs](#customizing-or-extending-the-basic-configs)
  - [Contributing](#contributing)

**Links**

- [Plugin Tools docs](https://grafana.github.io/plugin-tools/)
- [Plugin developer docs](https://grafana.com/docs/grafana/latest/developers/plugins/)
- [Plugin migration guide](https://grafana.com/docs/grafana/latest/developers/plugins/migration-guide/)

**`@grafana/create-plugin`** works on macOS, Linux and Windows Subsystem for Linux (WSL).<br />
If something doesn't work, please [file an issue](https://github.com/grafana/plugin-tools/issues/new).<br />
If you have questions or need help, please ask in [GitHub Discussions](https://github.com/grafana/plugin-tools/discussions).

## Create a new plugin

### Quick overview

Run the command in the folder where you want to store your plugins. The new plugin will be scaffolded in a sub-directory of the folder where you run the command.

Create Plugin can be used with NPM, PNPM or Yarn 1. The plugin will be scaffolded to use your preferred package manager. Run the command with the package manager of your choice:

#### [`npx`](https://github.com/npm/npx)

```bash
npx @grafana/create-plugin@latest
```

#### [`npm`](https://docs.npmjs.com/cli/v7/commands/npm-init)

```bash
npm init @grafana/plugin
```

#### [`pnpm`](https://pnpm.io/cli/dlx)

```bash
pnpm dlx @grafana/create-plugin@latest
```

#### [`yarn`](https://classic.yarnpkg.com/blog/2017/05/12/introducing-yarn/) (1.x)

```bash
yarn create @grafana/plugin
```

---

## Migrate your existing plugin

:warning: We [do not support](https://grafana.com/docs/grafana/latest/developers/angular_deprecation/) plugins written in `angular`

In case you have an existing plugin previously created using the `@grafana/toolkit` you can use the
following command to migrate it to the new build tooling:

```bash
# Run this command from the root of your plugin
cd ./my-plugin

npx @grafana/create-plugin@latest migrate
```

For more information see [here](https://grafana.github.io/plugin-tools/docs/migrating-from-toolkit)

---

## Update your plugin build config

**In case your plugin was using `@grafana/toolkit` before make sure to migrate it first using `npx @grafana/create-plugin migrate`.**

As new Grafana versions come out we keep updating our plugin build tooling as well to stay compatible and to make it more performant.
In order to receive these changes and to make sure your plugin is compatible with the most recent Grafana versions you can use the `update` command,
that automatically updates the build configuration for you:

```bash
# Run this command from the root of your plugin
cd ./my-plugin

npx @grafana/create-plugin@latest update
```

For more information see [here](https://grafana.github.io/plugin-tools/docs/updating-to-new-releases)

---

## Customizing or extending the basic configs

You can read more about customizing or extending the basic configuration [here](https://grafana.github.io/plugin-tools/docs/advanced-configuration/)

## Contributing

We are always grateful for contributions! See the [CONTRIBUTING.md](../CONTRIBUTING.md) for more information.
