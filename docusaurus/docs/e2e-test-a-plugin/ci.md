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

# CI workflow

You can use a CI workflow to run end-to-end tests that allow you to continuously check for breakages. We recommend using the following GitHub workflows for every PR in your GitHub repository to run end-to-end tests against a range of Grafana versions.

:::note

These are generic examples based on frontend and backend plugins. You may need to alter or remove some of the steps in the `playwright-tests` job before using it in your plugin.

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

## The e2e-versions Action

These example workflows have a job called `Resolve Grafana images` that uses the [e2e-version](https://github.com/grafana/plugin-actions/tree/main/e2e-version) Action to resolve a list of Grafana images. For every image returned, a new job is started that builds the plugin, starts Grafana, and runs the end-to-end tests.

The Action supports two modes:

- `plugin-grafana-dependency`
- `version-support-policy`.

### Use the plugin-grafana-dependency mode

The `plugin-grafana-dependency` mode is the default, so if you don't specify a value for the `version-resolver-type` input parameter, this is the resolver that will be used.

This mode returns the most recent grafana-dev image. Additionally, it returns all the latest patch releases of Grafana Enterprise since the version that was specified as `grafanaDependency` in the [plugin.json](../reference/metadata.md). To avoid starting too many jobs, the output is capped at 6 versions.

![plugin-grafana-dependency mode](/img/e2e-version-plugin-dependency.png)

### Use the version-support-policy mode

Except for resolving the most recent `grafana-dev` image, the `version-support-policy` mode resolves versions according to Grafana's plugin compatibility support policy. Specifically, it retrieves the latest patch release for each minor version within the current major version of Grafana. Additionally, it includes the most recent release for the latest minor version of the previous major Grafana version.

![Grafana version support policy](/img/e2e-version-version-support-policy.png)

To use the `version-support-policy` mode, you need to specify the `version-resolver-type` input argument like in this example:

```yml
- name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version
        with:
          version-resolver-type: version-support-policy
```

## Playwright report

The end-to-end tooling generates a Playwright HTML test report for every Grafana version that is being tested. In case any of the tests fail, a Playwright trace viewer is also generated along with the report. The `Upload artifacts` step in the example workflows uploads the report to GitHub as an artifact.

To find information on how to download and view the report, refer to the [Playwright documentation](https://playwright.dev/docs/ci-intro#html-report).
