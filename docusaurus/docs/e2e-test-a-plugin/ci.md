---
id: ci
title: CI Workflow
description: How to run end-to-end tests in CI
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

## Introduction

We recommend using a CI workflow to run end-to-end tests to continuously check for breakages. The following Github workflows will run end-to-end tests against a range of Grafana versions for every PR in your Github repository.

:::note
These are generic example based on a frontend and backend plugins. You may need to alter or remove some of the steps in the `playwright-tests` job before using it in your plugin.
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
{ component: BEPluginWorkflowNPM, label: 'npm' },
{ component: BEPluginWorkflowYarn, label: 'yarn' },
{ component: BEPluginWorkflowPNPM, label: 'pnpm' }
]}
groupId="package-manager"
queryString="current-package-manager"
/>
</details>

### The e2e-versions Action

The example workflows have a job called `resolve-versions` that uses the [e2e-version](https://github.com/grafana/plugin-actions/tree/main/e2e-version) Action to resolve a list of Grafana images. For every image returned, a new job will be fired up that builds the plugin, starts Grafana and runs the end-to-end tests.

The Action supports two modes - `plugin-grafana-dependency` and `version-support-policy`.

#### plugin-grafana-dependency mode

By default, the e2e-version Action will return the most recent grafana-dev image plus all the latest patch releases of every minor version of Grafana Enterprise since the version that was specified as `grafanaDependency` in the [plugin.json](../metadata.md). To avoid starting too many jobs, to output will be capped 6 versions.

![](/img/e2e-version-plugin-dependency.png)

#### version-support-policy mode

Except for resolving the most recent grafana-dev image, the `version-support-policy` mode will resolve versions according to Grafana's plugin compatibility support policy. Specifically, it retrieves the latest patch release for each minor version within the current major version of Grafana. Additionally, it includes the most recent release for the latest minor version of the previous major Grafana version.

![](/img/e2e-version-version-support-policy.png)

To use the `version-support-policy` mode you need to specify the `version-resolver-type` input argument.

```yml
- name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version
        with:
          version-resolver-type: version-support-policy
```

### Playwright report

A Playwright HTML test report is generated for every Grafana version that is being tested. In case any of tests failed, a Playwright trace viewer is also generated along with the report. The `Upload artifacts` step in the example workflows uploads the report as artifacts. To find information on how to download and view the report, refer to the Playwright [documentatation](https://playwright.dev/docs/ci-intro#html-report).
