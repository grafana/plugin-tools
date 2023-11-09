# Contributing to Grafana / Plugin Tools / Website

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

- [**`Docusaurus`**](https://docusaurus.io/) - the documentation website is built with docusaurus

### Folder structure

`/docusaurus` consists of the following folder structure:

```js
docusaurus/
├── docs/ // the home of all the website documentation
│   ├── create-a-plugin/
│   ├── get-started/
│   │   ├── _category_.json // category item metadata
│   │   ├── folder-structure.md // documentation file
│   │   └── get-started.mdx // documentation file using react components
│   ├── shared/ // special directory for sharing text
│   └── snippets/ // special directory for command snippets
└── website/
    ├── plugins/ // location of docusaurus custom plugins
    ├── src/ // react / js source code for website
    │   ├── components
    │   ├── css
    │   ├── pages
    │   └── theme
    ├── static/ // folder for static assets
    │   ├── font
    │   └── img
    ├── docusaurus.config.js
    └── package.json
```

## Development

There are a collection of [commands](#commmands) to assist with developing the webiste. Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code or documentation changes to the project.

### Commmands

Below are the main commands used for developing `create-plugin`. They can be run by either `npx nx run @grafana/create-plugin:<name_of_command>`, `npm run <name_of_command> -w @grafana/create-plugin` or navigating to `packages/create-plugin` and running the command directly as detailed below.

```shell
npm run build # creates a production build of the website.
```

```shell
npm run start # starts a local development server to preview changes as files are edited.
```

```shell
npm run serve # use this command to run the production build locally (requires the build command to be run first).
```

```shell
npm run clear # clears the docusaurus cache
```

### Conventions

Please refer to the [Grafana Writers' Toolkit](https://grafana.com/docs/writers-toolkit/).
