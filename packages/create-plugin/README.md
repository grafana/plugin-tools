# Grafana / Create Plugin

Create Grafana plugins with ease.

**ToC**

- [Grafana / Create Plugin](#grafana--create-plugin)
  - [Create a new plugin](#create-a-new-plugin)
    - [Quick overview](#quick-overview)
      - [`yarn` (1.x)](#yarn-1x)
      - [`yarn` (> 2.x)](#yarn--2x)
      - [`npx`](#npx)
      - [`npm`](#npm)
  - [Migrate your existing plugin](#migrate-your-existing-plugin)
    - [Things to check after migration](#things-to-check-after-migration)
  - [Update your plugin build config](#update-your-plugin-build-config)
  - [Customizing or extending the basic configs](#customizing-or-extending-the-basic-configs)
  - [Contributing](#contributing)

**Links**

- [Plugin developer docs](https://grafana.com/docs/grafana/latest/developers/plugins/)
- [Plugin migration guide](https://grafana.com/docs/grafana/latest/developers/plugins/migration-guide/)

**`@grafana/create-plugin`** works on macOS, Windows and Linux.<br />
If something doesn't work, please [file an issue](https://github.com/grafana/plugin-tools/issues/new).<br />
If you have questions or need help, please ask in [GitHub Discussions](https://github.com/grafana/plugin-tools/discussions).

## Create a new plugin

### Quick overview

Run the command in the folder where you want to store your plugins. The new plugin will be scaffolded in a sub-directory of the folder where you run the command.

You can run the command with the package manager of your choice:

#### [`yarn`](https://classic.yarnpkg.com/blog/2017/05/12/introducing-yarn/) (1.x)

```bash
yarn create @grafana/plugin
```

#### [`yarn`](https://yarnpkg.com/cli/dlx) (> 2.x)

```bash
yarn dlx @grafana/create-plugin
```

#### [`npx`](https://github.com/npm/npx)

```bash
npx @grafana/create-plugin
```

#### [`npm`](https://docs.npmjs.com/cli/v7/commands/npm-init)

```bash
npm init @grafana/plugin
```

---

## Migrate your existing plugin

In case you have an existing plugin previously created using the `@grafana/toolkit` you can use the
following command to migrate it to the new build tooling:

```bash
# Run this command from the root of your plugin
cd ./my-plugin

npx @grafana/create-plugin migrate
```

### Things to check after migration

- If you have a custom webpack configuration you might need to migrate it. You can read more about customizing or extending the basic configuration [here](templates/common/.config/README.md)
- Build your plugin. Run `yarn build` to check your plugin builds as intended.
- Test your plugin. Test your plugin inside grafana to confirm it is working as intended.

---

## Update your plugin build config

**In case your plugin was using `@grafana/toolkit` before make sure to migrate it first using `npx @grafana/create-plugin migrate`.**

As new Grafana versions come out we keep updating our plugin build tooling as well to stay compatible and to make it more performant.
In order to receive these changes and to make sure your plugin is compatible with the most recent Grafana versions you can use the `update` command,
that automatically updates the build configuration for you:

```bash
# Run this command from the root of your plugin
cd ./my-plugin

npx @grafana/create-plugin update
```

---

## Customizing or extending the basic configs

You can read more about customizing or extending the basic configuration [here](templates/common/.config/README.md)

## Contributing

We are always grateful for contributions! See the [CONTRIBUTING.md](../CONTRIBUTING.md) for more information.
