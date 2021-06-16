# grafana-eslint-config

> Grafana's [ESLint](https://eslint.org) config.

## Installation

```shell
yarn add @grafana/eslint-config --dev
```

or:

```shell
npm install @grafana/eslint-config --save-dev
```

Don't forget to install peerDependencies.

1. Install the correct versions of each package, which are listed by the command:

```sh
npm info "@grafana/eslint-config@latest" peerDependencies
```

If using **npm 5+**, use this shortcut

```sh
npx install-peerdeps --dev @grafana/eslint-config
```

If using **yarn**, you can also use the shortcut described above if you have npm 5+ installed on your machine, as the command will detect that you are using yarn and will act accordingly.
Otherwise, run `npm info "@grafana/eslint-config@latest" peerDependencies` to list the peer dependencies and versions, then run `yarn add --dev <dependency>@<version>` for each listed peer dependency.

## Usage

```json
{
  "extends": ["@grafana/eslint-config"]
}
```

It will automatically handle `*.(js|ts|tsx)` files.

## Publishing

Publishing is handled by github actions which is triggered by a merge to master that contains a change to the version property in the `package.json` file. You can either do that manually or use the command below to version bump, commit and tag.

```shell
npm version [<newversion> | major | minor | patch ]
```

Also be sure to update any official packages that depend on this with fixes and version increases.

## Versioning

It's probable that _any_ change will be a breaking one, so it's best to stick to major version releases.
