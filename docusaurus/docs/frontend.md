---
id: frontend
title: Frontend
---

The Frontend part of Grafana plugins are written in Typescript with support for React as the view library. Within the plugin directory, you can run:

### `yarn dev`

Builds the plugin in development mode and watches for changes to source code to rebuild the plugin.

### `yarn build`

Builds the plugin for production. The output can be found in the `./dist` directory.

### `yarn test`

Launches the test runner in watch mode.

### `yarn server`

Launches an instance of Grafana for developing a plugin. See the section about [Docker](docker.md) for more information

### `yarn e2e`

Launches the e2e test runner. (Make sure to have an instance of Grafana running before running e2e tests.)

### `yarn lint`

Run the linter against source code to verify formatting and styling rules are adherred to.

### `yarn lint:fix`

Run the linter in fix mode to automatically format the frontend code.
