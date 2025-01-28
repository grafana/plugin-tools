---
id: ci
title: CI workflow
description: How to run end-to-end tests in CI.
keywords:
  - grafana
  - plugins
  - plugin
  - e2e
  - end-to-end
  - ci
sidebar_position: 30
---

import BEPluginWorkflowNPM from '@snippets/plugin-e2e-ds-workflow.npm.md';
import BEPluginWorkflowYarn from '@snippets/plugin-e2e-ds-workflow.yarn.md';
import BEPluginWorkflowPNPM from '@snippets/plugin-e2e-ds-workflow.pnpm.md';
import FEPluginNPM from '@snippets/plugin-e2e-fe-plugin-workflow.npm.md';
import FEPluginYarn from '@snippets/plugin-e2e-fe-plugin-workflow.yarn.md';
import FEPluginPNPM from '@snippets/plugin-e2e-fe-plugin-workflow.pnpm.md';

Due to Grafana’s [dependency sharing mechanism](../key-concepts/manage-npm-dependencies.md), many plugin-related issues only emerge at runtime. For instance, if a datasource plugin’s query editor calls the `createDataFrame` function (introduced in `grafana/data` version 10.1.0), it will cause crashes on all pages rendering the query editor in Grafana versions prior to 10.1.0, unless proper [fallbacks](../how-to-guides/runtime-checks.md) are implemented.

These runtime-specific issues cannot be detected through unit tests, but they can be effectively identified by running end-to-end tests. The `grafana/plugin-e2e` library, compatible with all Grafana versions since 8.5, enables developers to write a single test suite that works across multiple Grafana versions. You can then leverage the `e2e-version` GitHub Action to run Playwright tests against a range of versions of Grafana that the plugin supports. This article guides you through setting up a CI workflow using the `e2e-version` matrix.

## The e2e-versions Action

The `e2e-versions` GitHub Action generates a matrix of Grafana image names and versions for use in end-to-end testing a Grafana plugin within a GitHub workflow. The Action supports two modes:

- **`plugin-grafana-dependency:`** This mode resolves the most recent `grafana-dev` image and returns all the latest patch releases of Grafana Enterprise since the version specified as `grafanaDependency` in the `plugin.json` file. To prevent the initiation of too many jobs, the output is capped at 6 versions. This is the default mode.
- **`version-support-policy:`** In this mode, the action resolves versions based on Grafana's plugin compatibility support policy. It retrieves the latest patch release for each minor version within the current major Grafana version. Additionally, it includes the most recent release for the latest minor version of the previous major Grafana version.

For detailed information on configuring the `inputs`, visit the `e2e-versions` [GitHub page](https://github.com/grafana/plugin-actions/tree/main/e2e-version).

## Example workflows

All Grafana plugins created with `grafana/create-plugin` version 4.7.0 or later automatically include end-to-end tests against a Grafana version matrix as part of their `ci.yml` workflow. If your plugin was created with an earlier version, you can use the following example workflows to set up and run end-to-end tests with a Grafana version matrix in a separate GitHub workflow:

:::note

The following examples are generic and based on frontend and backend plugins. Depending on the specifics of your plugin, you may need to modify or remove certain steps in the `playwright-tests` job before integrating them into your plugin’s workflow.

:::

<details>
  <summary> <h3>Backend plugin workflow</h3> </summary>
  <CodeSnippets
snippets={[
{ component: BEPluginWorkflowNPM, label: 'npm' },
{ component: BEPluginWorkflowYarn, label: 'yarn' },
{ component: BEPluginWorkflowPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>
</details>

<details>
  <summary> <h3>Frontend plugin workflow</h3> </summary>
  <CodeSnippets
snippets={[
{ component: FEPluginNPM, label: 'npm' },
{ component: FEPluginYarn, label: 'yarn' },
{ component: FEPluginPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>
</details>

## Playwright report

The end-to-end tooling generates a Playwright HTML test report for every Grafana version that is being tested. In case any of the tests fail, a Playwright trace viewer is also generated along with the report. The `Upload artifacts` step in the example workflows uploads the report to GitHub as an artifact.

To find information on how to download and view the report, refer to the [Playwright documentation](https://playwright.dev/docs/ci-intro#html-report).
