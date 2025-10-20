# Contributing to Grafana / TSconfig

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

### Folder structure

_Work in progress._

## Development

Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code changes to the project.

### Commands

This package has no build process. When making changes it's best to test it either by linking it:

```shell
npm link -w @grafana/tsconfig
```

Or packing it into a tarball and installing it in a test repo:

```shell
npm pack -w @grafana/tsconfig
```
