# Contributing to Grafana / Create Plugin

We are always grateful to receive contribution!<br />
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

## Overview

### Technologies

- [**`minimist`**](https://www.npmjs.com/package/minimist) - for parsing cmd line args
- [**`enquirer`**](https://www.npmjs.com/package/enquirer) - for prompting users for information
- [**`handlebars`**](https://www.npmjs.com/package/handlebars) - for file templates

### Folder structure

`@grafana/create-plugin` consists of the following folder structure:

```js
├── src // Executable code
│   ├── bin // the entrypoint file
│   ├── commands // Code that runs commands
│   └── utils // Utilities used by commands
└── templates // Handlebars templates
    ├── _partials // Composable parts of a template
    ├── app // Templates specific to scaffolding an app plugin
    ├── backend // Templates specific to scaffolding backend plugin code
    ├── common // Common templates used by all plugin types (e.g. tooling config files)
    ├── datasource // Templates specific to scaffolding a datasource plugin
    ├── github // Templates for github workflows
    └── panel // Templates specific to scaffolding a panel plugin
```

## Development

There are a collection of [commands](#commmands) to assist with developing `create-plugin`. Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code changes to the project.

### Commmands

Below are the main commands used for developing `create-plugin`. They can be run by either `npx nx run @grafana/create-plugin:<name_of_command>`, `npm run <name_of_command> -w @grafana/create-plugin` or navigating to `packages/create-plugin` and running the command directly as detailed below.

```shell
npm run build # used to build @grafana/create-plugin
```

```shell
npm run dev # watches for changes to files and rebuilds @grafana/create-plugin automatically
```

```shell
npm run dev-app # watches for changes and scaffolds an app plugin (in ./generated) for developing app configs
```

```shell
npm run dev-panel # watches for changes and scaffolds an app plugin (in ./generated) for developing panel configs
```

```shell
npm run dev-datasource # watches for changes and scaffolds an app plugin (in ./generated) for developing datasource configs
```

### Conventions

_Work in progress._

### Developing the templates

The templates are used by Handlebars to scaffold Grafana plugins. Whilst they appear to be the intended filetype they are infact treated as markdown by Handlebars when it runs. As such we need to be mindful of syntax and to [escape particular characters](https://handlebarsjs.com/guide/expressions.html#whitespace-control) where necessary. The [github/ci.yml](./templates/github/ci/.github/workflows/ci.yml) file is a good example of this.

Note that certain files are intentionally named differently (e.g. npmrc, package.json). This is done due to other tooling preventing the files from being packaged for NPM or breaking other tools during local development.
