# Grafana / Create Plugin

Create Grafana plugins with ease.

**ToC**

- [Create a new plugin](#create-a-new-plugin)
- [Migrate your existing plugin](#migrate-your-existing-plugin)
- [Update your plugin build config](#update-your-plugin-build-config)
- [Start developing your plugin](#start-developing-your-plugin)
- [Contributing](#contributing)

**Links**

- [Plugin developer docs](https://grafana.com/docs/grafana/latest/developers/plugins/)
- [Plugin migration guide](https://grafana.com/docs/grafana/latest/developers/plugins/migration-guide/)

**`@grafana/create-plugin`** works on macOS, Windows and Linux.<br />
If something doesn’t work, please [file an issue](https://github.com/grafana/create-plugin/issues/new).<br />
If you have questions or need help, please ask in [GitHub Discussions](https://github.com/grafana/create-plugin/discussions).

## Create a new plugin

### Quick overview

The following commands scaffold a Grafana plugin inside the `./my-plugin` folder:

```bash
mkdir my-plugin && cd my-plugin
yarn create @grafana/plugin
yarn install
yarn dev
```

Alterntives:

#### [`npx`](https://github.com/npm/npx)

```bash
npx @grafana/create-plugin
```

#### [`npm`](https://docs.npmjs.com/cli/v7/commands/npm-init)

```bash
npm init @grafana/plugin
```

#### [`yarn`](https://classic.yarnpkg.com/blog/2017/05/12/introducing-yarn/) (1.x)

```bash
yarn create @grafana/plugin
```

#### [`yarn`](https://yarnpkg.com/cli/dlx) (> 2.x)

```bash
yarn dlx @grafana/create-plugin
```

---

## Migrate your existing plugin

In case you have an existing plugin previously created using the `@grafana/toolkit`, then you can use the
following command to migrate it to the new build tooling:

```bash
# Run this command from the root of your plugin
cd ./my-plugin

npx @grafana/create-plugin migrate
```

---

## Update your plugin build config

As new Grafana versions come out we keep updating our plugin build tooling as well to stay compatible and to make it more performant.
In order to receive these changes and to make sure your plugin is compatible with the most recent Grafana versions you can use the `update` command,
that automatically updates the build configuration for you:

```bash
# Run this command from the root of your plugin
cd ./my-plugin

npx @grafana/create-plugin update
```

---

## Start developing your plugin

We have put together the following dev scripts for you, so you can start coding right away:

#### `yarn dev`

Starts the build in watch mode.
The build output (plugin bundle) is going to be exported to `./dist`.

#### `yarn build`

Creates a production build for your plugin.
The build output is going to be exported to `./dist`.

#### `yarn test`

Runs the tests under `./src` directory in watch mode.
Give your test files a `.test.tsx` or `.test.ts` extension.

#### `yarn test:ci`

Runs the tests and returns with either a zero or a non-zero exit status.

#### `yarn typecheck`

Runs the Typescript compiler against the codebase in a dry-run mode to highlight any type errors or warnings.

#### `yarn lint`

Runs ESLint against the codebase.

#### `yarn lint:fix`

Runs ESLint against the codebase and attempts to fix the simpler errors.

---

## Contributing

We are always grateful for contribution! See the [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.
