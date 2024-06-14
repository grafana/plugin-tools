---
id: cli-commands
title: CLI commands
description: Reference for CLI commands of the create-plugin tool.
keywords:
  - grafana
  - plugins
  - plugin
  - create-plugin
  - prompts
  - CLI
sidebar_position: 20
---

# CLI commands

Use the CLI for essential tasks of plugin development, substituting `npm` for `pnpm`, or `yarn` based on your choice of package manager.

### `npm run build`

Compiles and bundles the project using Webpack in production mode.

### `npm run dev`

Runs Webpack in watch mode for development, continually monitoring for changes.

### `npm run e2e`

Runs Grafana end-to-end tests using Cypress.

### `npm run e2e:update`

Runs Grafana end-to-end tests and tests any test screenshots, using Cypress.

### `npm run lint`

Lints the frontend codebase using ESLint with the `.gitignore` file to ignore certain files. Results are cached locally to speed up future linting tasks.

### `npm run lint:fix`

Lints the frontend codebase using ESLint and automatically fixes detected issues.

### `npm run typecheck`

Performs a type-checking process on the frontend code using TypeScript.

### `npm run server`

Launches the [Grafana development server](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment) using Docker.

### `npm run sign`

Signs the Grafana plugin using the latest version of `@grafana/sign-plugin`.

### `npm run test`

Executes frontend tests, running only the tests that have changed, and enables a watch mode for ongoing testing.

### `npm run test:ci`

Runs frontend tests for CI, ensuring it passes even with no tests, and utilizes a maximum of four workers for parallel execution.
