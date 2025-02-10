# Contributing to Grafana / ESLint Plugin Plugins

We are always grateful to receive contributions!<br />
The following guidelines help you on how to start with the codebase and how to submit your work.

## Installation

### Prerequisites

You need to have `npm` installed.

### Installing

```bash
git clone git@github.com:grafana/plugin-tools.git
cd plugin-tools
npm install
```

## Development

There are a collection of [commands](#commmands) to assist with developing `eslint-plugin-plugins`. Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code changes to the project.

### Commmands

Below are the main commands used for developing `eslint-plugin-plugins`. They can be run by either `npx nx run @grafana/eslint-plugin-plugins:<name_of_command>`, `npm run <name_of_command> -w @grafana/eslint-plugin-plugins` or navigating to `packages/eslint-plugin-plugins` and running the command directly as detailed below.

```shell
npm build # used to build @grafana/eslint-plugin-plugins
```

```shell
npm dev # watches for changes to files and rebuilds @grafana/eslint-plugin-plugins automatically
```
