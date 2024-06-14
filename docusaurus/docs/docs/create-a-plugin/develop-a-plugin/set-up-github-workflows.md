---
id: set-up-github-workflows
title: Set up GitHub workflows
description: How to automate your plugin development process by using GitHub workflows.
keywords:
  - grafana
  - plugins
  - plugin
  - github
  - workflows
  - CI
  - continuous integration
  - automation
sidebar_position: 4
---

Automate your development process to minimize errors and make it faster and more cost-efficient. The `create-plugin` tool helps you to configure your GitHub actions workflows to help automate your development process.

## The CI workflow

The CI (`ci.yml`) workflow is designed to lint, type check, and build the frontend and backend. It is also used to run tests on your plugin every time you push changes to your repository. The `create-plugin` tool helps to catch any issues early in the development process, before they become bigger problems.

## The release workflow

The release (`release.yml`) workflow is designed to build, test, package and sign your plugin whenever you're ready to release a new version. This automates the process of creating releases in GitHub and provides instructions for submitting the plugin to the Grafana plugin catalog.

:::warning

This workflow requires a Grafana Cloud API key. Before you begin, follow the instructions for [generating an Access Policy token](../../publish-a-plugin/sign-a-plugin#generate-an-access-policy-token).

:::

### Storing your Access Policy token as a repository secret in GitHub

1. Access Repository Settings:

- Go to your GitHub repository.
- Navigate to the "Settings" tab.

2. In the left sidebar, click on Secrets and Variables -> Actions
3. Click on the "New repository secret" button.
4. Add Secret Information:

- Enter name for your secret - GRAFANA_ACCESS_POLICY_TOKEN.
- Paste the Access Policy Token value into the "Secret" field.

5. Click on the "Add secret" button to save the secret.

Once the secret is stored, you can access it in your GitHub Actions workflow:

```json title="release.yml"
name: Release

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/plugin-actions/build-plugin@release
        with:
          grafana_token: ${{ secrets.GRAFANA_ACCESS_POLICY_TOKEN }}

```

In this example, the `secrets.GRAFANA_ACCESS_POLICY_TOKEN` variable is used to access the stored token securely within your GitHub Actions workflow. Make sure to adjust the workflow according to your specific needs and the language/environment you are working with.

### Triggering the workflow

To trigger the release workflow, push a Git tag for the plugin version that you want to release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## The compatibility check (`is-compatible.yml`)

The compatibility check (`is-compatible.yml`) workflow is designed to check the Grafana API compatibility of your plugin every time you push changes to your repository. This helps to catch potential frontend runtime issues before they occur.

The workflow contains the following steps:

1. Finding `@grafana` npm packages in your plugin.
1. Extracting the exported types of the specified version.
1. Comparing the differences between that version and the latest version.
1. Looking for usages of those changed APIs inside your plugin.
1. Reporting any potential incompatibilities.

## Run e2e tests
