# Grafana / Create Plugin

Create Grafana plugins with ease.

- [Plugin developer docs](https://grafana.com/docs/grafana/latest/developers/plugins/)
- [How to run my plugin inside Grafana?]()
- [How to publish my plugin on grafana.com?]()

**`@grafana/create-plugin`** works on macOS, Windows and Linux.<br />
If something doesn’t work, please [file an issue](https://github.com/grafana/create-plugin/issues/new).<br />
If you have questions or need help, please ask in [GitHub Discussions](https://github.com/grafana/create-plugin/discussions).

## Usage

### Quick overview

```bash
mkdir my-plugin && cd my-plugin
yarn create @grafana/plugin
yarn install
yarn dev
```

The commands above scaffold a Grafana plugin inside the `./my-plugin` folder.

### npx

```bash
npx @grafana/create-plugin
```

([More info on how to install `npx`](https://github.com/npm/npx))

### npm

```bash
npm init @grafana/plugin
```

([More info about `npm init`](https://docs.npmjs.com/cli/v7/commands/npm-init))

### yarn

```bash
yarn create @grafana/plugin
```

([More info about `yarn create`](https://classic.yarnpkg.com/blog/2017/05/12/introducing-yarn/))

## Available scripts

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

## Contributing

We are always grateful for contribution! See the [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.
