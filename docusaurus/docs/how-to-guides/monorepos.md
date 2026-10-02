---
id: monorepos
title: Develop several plugins in one repository
description: Use create-plugin to scaffold and maintain a monorepo of Grafana plugins that share one configuration, one install, CI and release workflows, and a development server.
keywords:
  - grafana
  - plugins
  - plugin
  - monorepo
  - workspaces
  - create-plugin
---

# Develop several plugins in one repository

A plugin monorepo keeps several Grafana plugins, for example an app and the data source it uses, in one repository. Each plugin is still built, tested, signed, and released on its own, but the plugins share:

- One tool-managed `.config/` directory and one create-plugin version, so `update` keeps every plugin current
- One lockfile and one install
- One Grafana development server that loads every plugin
- CI and release workflows that pick up every plugin you add

Plugin monorepos work with npm, pnpm, and Yarn 2 or later. Yarn 1 isn't supported. The examples on this page use npm. If you use pnpm or Yarn, run the equivalent commands.

## Repository layout

```
my-plugins/
├── package.json           # workspaces, packageManager, tooling, and scripts that run in every plugin
├── .config/               # shared configuration, managed by create-plugin
├── docker-compose.yaml    # one Grafana that loads every plugin
├── provisioning/          # provisioning for every plugin
├── release-please-config.json
├── .github/workflows/
├── packages/              # optional shared workspace packages
└── plugins/
    ├── myorg-myapp-app/
    └── myorg-mydatasource-datasource/
```

Each directory under `plugins/` is a complete plugin with its own `src/`, tests, `package.json`, version, and `CHANGELOG.md`.

## Create a monorepo

Run `create-plugin` with the `--monorepo` flag. It asks the usual questions and creates the monorepo with its first plugin:

```shell
npx @grafana/create-plugin@latest --monorepo
```

By default, `create-plugin` names the monorepo directory `<organization>-plugins`. To choose another name, pass `--monorepo-name`:

```shell
npx @grafana/create-plugin@latest --monorepo --monorepo-name=my-plugins
```

Then install the dependencies for every plugin from the repository root:

```shell
cd my-plugins
npm install
```

## Add a plugin

Run `create-plugin` from the root of the monorepo:

```shell
npx @grafana/create-plugin@latest
```

`create-plugin` creates the plugin in `plugins/<plugin-id>`, then adds it to the development server, the provisioning, and the release configuration. Run `npm install` from the root afterwards.

:::note

`create-plugin` won't run inside a plugin, or inside a workspace that it didn't create.

:::

## Share code between plugins

Plugins can't import code from each other. Each plugin has its own bundle, signature, and release, so the `@grafana/plugins/no-cross-plugin-imports` ESLint rule reports an error when a plugin imports another plugin's files or reaches outside its own directory with a relative path. The monorepo's shared ESLint configuration turns the rule on, and `npm run lint` and CI run it for every plugin.

Put shared code in a workspace package in `packages/` instead:

1. Create the package, for example `packages/shared-utils`, with a `package.json` that has a `name` such as `@myorg/shared-utils`.
1. Build the package to JavaScript with type declarations. Plugins type check only their own `src` directory, so they need the built `.d.ts` files.
1. Add the package as a dependency of each plugin that uses it:
   - npm: the package's version, for example `"@myorg/shared-utils": "1.0.0"`
   - pnpm and Yarn: `"@myorg/shared-utils": "workspace:*"`
1. Run the install from the repository root, then import the package by name in your plugin code.

## Run commands

Run a plugin's scripts from its directory:

```shell
cd plugins/myorg-myapp-app
npm run dev
```

The root `package.json` has `build`, `typecheck`, `lint`, `test:ci`, and `e2e` scripts that run the script in every plugin:

```shell
npm run build
```

To build a backend plugin, run `mage` in the plugin directory.

## Update the plugins

Run `update` from the repository root, or from inside any plugin:

```shell
npx @grafana/create-plugin@latest update
```

It updates the shared `.config/` directory and every plugin in one run, then installs once from the root.

## Add features with `add`

Some additions change the shared configuration, so they apply to every plugin. Others change individual plugins. To choose the plugins, pass `--plugin` with a plugin ID or directory. You can repeat the flag:

```shell
npx @grafana/create-plugin@latest add example-addition --plugin myorg-myapp-app
```

Without `--plugin`, `add` asks before it applies a plugin addition to every plugin. Pass `--yes` to skip the question.

## Run Grafana locally

Start the development server from the repository root:

```shell
docker compose up --build
```

The server loads every plugin's `dist/` directory and the provisioning in `provisioning/`. Build each plugin first, for example with `npm run build` from the root. Running `npm run server` from a plugin directory starts the same server.

## CI and releases

The GitHub workflows find plugins by looking for `plugins/*/src/plugin.json`, so plugins you add need no workflow changes:

- `ci.yml` builds, lints, and tests each plugin, then runs its end-to-end tests against the Grafana versions it supports.
- `release-please.yml` uses [release-please](https://github.com/googleapis/release-please) to open a release pull request for every plugin with unreleased changes. When you merge it, release-please tags each released plugin `<plugin-id>-v<version>`, and the workflow attaches the plugin archive to its GitHub release. Use [conventional commit](https://www.conventionalcommits.org/) messages so release-please can choose the version bump.

To sign plugins in CI, add a `GRAFANA_ACCESS_POLICY_TOKEN` repository secret. Refer to [Sign a plugin](../publish-a-plugin/sign-a-plugin.md).

### Use the plugin CI workflows for Grafana Labs teams

Grafana Labs teams that use the reusable workflows in [`grafana/plugin-ci-workflows`](https://github.com/grafana/plugin-ci-workflows) call them once for each plugin and set these inputs:

- `plugin-directory`: the plugin's directory, for example `plugins/myorg-myapp-app`
- `dist-artifacts-prefix`: a prefix that's unique to the plugin, for example `myorg-myapp-app-`, so artifacts from several plugins don't clash
- `disable-github-release: true`: release-please creates the GitHub releases instead
- `docs-source-directory`: the plugin's docs directory relative to the repository root, if the plugin has docs

## Limitations

- The `experimental-app-sdk` addition doesn't support monorepos yet.
- The shared development server doesn't attach a backend debugger or rebuild backends when their code changes. After you change a backend, run `mage` in the plugin directory and restart the server.
