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

This article walks through the process of running end-to-end tests against a matrix of Grafana versions.

## Why run end-to-end tests against a matrix of Grafana versions

Due to Grafana’s [dependency sharing mechanism](../key-concepts/manage-npm-dependencies.md), many plugin-related issues only emerge at runtime. For example, if a plugin invokes a function, component or class that is unavailable in the Grafana runtime environment, any page loading that part of the plugin will crash. These runtime-specific issues are beyond the scope of unit tests but can be effectively identified through end-to-end testing.

To maintain reliability and compatibility, plugin developers must regularly perform end-to-end tests across all supported Grafana versions. The `e2e-versions` GitHub Action simplifies this process by automatically resolving supported Grafana versions based on your plugin's `grafanaDependency`, while also including Grafana's main development branch. Integrating this Action into your CI workflows ensures your plugin remains stable and compatible with both older and newer versions of Grafana, giving you confidence in its functionality across versions."

## The e2e-versions Action

The `e2e-versions` GitHub Action generates a matrix of Grafana image names and versions for use in end-to-end testing a Grafana plugin within a GitHub workflow. The Action supports two modes:

- **`plugin-grafana-dependency:`** This mode resolves the most recent `grafana-dev` image and returns all the latest patch releases of Grafana Enterprise since the version specified as `grafanaDependency` in the `plugin.json` file. To prevent the initiation of too many jobs, the output is capped at 6 versions. This is the default mode.
- **`version-support-policy:`** In this mode, the action resolves versions based on Grafana's plugin compatibility support policy. It retrieves the latest patch release for each minor version within the current major Grafana version. Additionally, it includes the most recent release for the latest minor version of the previous major Grafana version.

For detailed information on configuring the `inputs`, visit the `e2e-versions` [GitHub page](https://github.com/grafana/plugin-actions/tree/main/e2e-version).

## Example workflows

All Grafana plugins created with `grafana/create-plugin` version 4.7.0 or later automatically include end-to-end tests against a Grafana version matrix as part of their `ci.yml` workflow. If your plugin was created with an earlier version, you can use the following example workflows to set up and run end-to-end tests with a Grafana version matrix in a separate GitHub workflow:

:::note

The following examples are generic and based any kind of plugin. Depending on the specifics of your plugin, you may need to modify or remove certain steps in the `playwright-tests` job before integrating them into your plugin’s workflow.

:::

<details>
  <summary> <h3>Plugins with backend workflow</h3> </summary>
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
  <summary> <h3>Frontend-only plugin workflow</h3> </summary>
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

## Publish Playwright reports to GitHub Pages

The Playwright [HTML report](https://playwright.dev/docs/test-reporters#html-reporter), along with the [Trace Viewer](https://playwright.dev/docs/trace-viewer), provides powerful tools for troubleshooting issues found during the execution of end-to-end test. This section explains how to deploy these reports to GitHub's static site hosting service GitHub Pages, making them immediately accessible for review after tests complete.

This guide is based on the example workflow provided earlier in this document.

### Steps to enable report publishing

1. Immediately following the step that executes the tests, add a step that uses the `upload-report-artifacts` Action to upload the report and a test summary as an to GitHub artifacts.

```yml
- name: Run Playwright tests
  id: run-tests
  run: npx playwright test

- name: Upload e2e test summary
  uses: grafana/plugin-actions/playwright-gh-pages/upload-report-artifacts@main
  if: ${{ (always() && !cancelled()) }}
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    test-outcome: ${{ steps.run-tests.outcome }}
```

2. After the `playwright-tests` job, add a new job to download the report artifacts, deploy them to GitHub Pages, and publish a PR comment summarizing the test results, including links to the reports.

```yml
publish-report:
  if: ${{ (always() && !cancelled()) }}
  needs: [playwright-tests]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Publish report
      uses: grafana/plugin-actions/playwright-gh-pages/deploy-report-pages@main
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
```

3. Modify the workflow permissions to allow it to push changes, query the GitHub API and update PR comments.

```yml
permissions:
  contents: write
  id-token: write
  pull-requests: write
```

4. If GitHub Pages is not yet enabled for your repository, configure a source branch for deployment. Follow the detailed instructions [here](https://github.com/grafana/plugin-actions/tree/main/playwright-gh-pages#github-pages-branch-configuration) to set it up.

For additional configuration options and examples, refer to the `playwright-gh-pages` [documentation](https://github.com/grafana/plugin-actions/blob/main/playwright-gh-pages/README.md).

### Important considerations

- **Public visibility**: By default, GitHub Pages sites are publicly accessible on the Internet. If your end-to-end tests include sensitive data or secrets, be aware of potential exposure risks.
- **Enterprise access control**: If you have a GitHub Enterprise account, you can configure access controls to restrict visibility. For details, refer to the [GitHub documentation](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

### Report summary

The `publish-report` job adds a PR comment summarizing all the tests executed as part of the matrix. For tests that failed, the comment includes links to the GitHub Pages website, where the detailed reports can be browsed.

![](/img/e2e-report-summary.png)

```

```
