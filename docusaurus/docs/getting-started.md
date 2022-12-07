---
id: getting-started
title: Getting Started
---

Create Plugin is the officially supported way to develop plugins to extend Grafana in amazing ways! It offers a modern build setup with zero configuration.

## Quick Start

```shell
yarn create @grafana/plugin
```

Now follow the prompts to scaffold a Grafana plugin.

### What you'll need

- [Go](https://go.dev/doc/install) version 1.18 or above
- [Mage](https://magefile.org/)
- [Node.js](https://nodejs.org/en/download/) version 16 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
- [Yarn 1](https://classic.yarnpkg.com/lang/en/docs/install)
- [Docker](https://docs.docker.com/get-docker/)

## Output

Running the above command will create a directory called `<orgName>-<pluginName>-<pluginType>` inside the current directory. Within this new directory is the initial project structure to kickstart development.

:::info

The directory name `<orgName>-<pluginName>-<pluginType>` is based on the answers given by the prompts. Please replace any commands with the name of the generated folder.

:::

Depending on the answers given to the prompts there should be a structure like:

```
<orgName>-<pluginName>-<pluginType>
├── .config
├── .eslintrc
├── .github
│   └── workflows
├── .gitignore
├── .nvmrc
├── .prettierrc.js
├── CHANGELOG.md
├── LICENSE
├── Magefile.go
├── README.md
├── cypress
│   └── integration
├── docker-compose.yaml
├── go.mod
├── go.sum
├── jest-setup.js
├── jest.config.js
├── node_modules
├── package.json
├── pkg
│   ├── main.go
│   └── plugin
├── src
│   ├── README.md
│   ├── components
│   ├── datasource.ts
│   ├── img
│   ├── module.ts
│   ├── plugin.json
│   └── types.ts
└── tsconfig.json
```

Once the installation is done you can open the plugin folder:

```shell
cd <orgName>-<pluginName>-<pluginType>
yarn install
```

## Scripts

Inside the newly create plugin, you can run some built-in commands:

### `yarn dev`

Builds plugin in development mode and runs in watch mode. The plugin will be rebuilt whenever you make changes to the code. You will see build errors and lint warnings in the console.

### `yarn test`

Runs the tests and watches for changes

### `yarn build`

Creates a production build of the plugin optimizing for the best performance. The build is minified and the filenames include hashes.

### `mage -v`

Build backend plugin binaries for Linux, Windows and Darwin.
