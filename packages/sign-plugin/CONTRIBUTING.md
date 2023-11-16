# Contributing to Grafana / Sign Plugin

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

## Overview

### Technologies

- [**`minimist`**](https://github.com/minimistjs/minimist) - used for parsing argument options

### Folder structure

_Work in progress._

## Development

There are a collection of [commands](#commmands) to assist with developing `sign-plugin`. Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code changes to the project.

### Commmands

Below are the main commands used for developing `sign-plugin`. They can be run by either `npx nx run @grafana/sign-plugin:<name_of_command>`, `npm run <name_of_command> -w @grafana/sign-plugin` or navigating to `packages/sign-plugin` and running the command directly as detailed below.

```shell
npm build # used to build @grafana/sign-plugin
```

```shell
npm dev # watches for changes to files and rebuilds @grafana/sign-plugin automatically
```

### Conventions

_Work in progress._
