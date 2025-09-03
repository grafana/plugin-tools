---
id: set-up-github
title: Set up GitHub workflows for your development environment
sidebar_label: Set up your GitHub workflows
description: Set up GitHub for Grafana plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - create-plugin
  - GitHub
  - setup
  - CI
  - continuous integration
  - automation
  - configuration
sidebar_position: 20
---

Automate your development process to minimize errors and make it faster and more cost-efficient. The `create-plugin` tool helps you to configure your GitHub actions workflows to help automate your development process.

## The CI workflow

The CI (`ci.yml`) workflow is designed to lint, type check, and build the frontend and backend. It is also used to run tests on your plugin every time you push changes to your repository. The `create-plugin` tool helps to catch any issues early in the development process, before they become bigger problems. For more information on end-to-end testing as part of the CI workflow, refer to our [documentation](/e2e-test-a-plugin/ci.md).

## The release workflow

To learn how to automate the release process and set up the release workflow, refer to our documentation on [Automate packaging and signing with GitHub CI](/publish-a-plugin/build-automation).

:::warning

This workflow requires a Grafana Cloud API key. Before you begin, follow the instructions for [generating an Access Policy token](/publish-a-plugin/sign-a-plugin#generate-an-access-policy-token).

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

```yaml title="release.yml"
name: Release

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/plugin-actions/build-plugin@main
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

## The compatibility check workflow

The compatibility check (`is-compatible.yml`) workflow is designed to check the Grafana API compatibility of your plugin every time you push changes to your repository. This helps to catch potential frontend runtime issues before they occur.

The workflow contains the following steps:

1. Finding `@grafana` npm packages in your plugin.
1. Extracting the exported types of the specified version.
1. Comparing the differences between that version and the latest version.
1. Looking for usages of those changed APIs inside your plugin.
1. Reporting any potential incompatibilities.

## The create plugin update workflow

The create plugin update (`cp-update.yml`) workflow is designed to automate keeping your plugins development environment and dependencies up to date. It periodically checks the latest version of create-plugin listed on the npm registry and compares it to the version used by your plugin. If there is a newer version available the workflow will run the `create-plugin update` command, update the frontend dependency lockfile, then create a PR with the changes for review.

This workflow requires content and pull request write access to your plugins repo to be able to push changes and open PRs. Choose from the following two options:

### Use the default access token

To use this option you must allow [github actions to create and approve pull requests](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#preventing-github-actions-from-creating-or-approving-pull-requests) within your repository settings and use the `permissions` property in the workflow to elevate the default access token permissions like so:

```yaml
name: Create Plugin Update

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 1 * *' # run once a month on the 1st day

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: grafana/plugin-actions/create-plugin-update@main
```

### Use a personal access token

To use this option you must create a Github [fine-grained personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with access to the plugin repository and permission to read and write both `contents` and `pull requests`. Once created add the token to the plugin repository action secrets and then pass it to the action like so:

```yaml
name: Create Plugin Update

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 1 * *' # run once a month on the 1st day

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: grafana/plugin-actions/create-plugin-update@main
        with:
          token: ${{ secrets.GH_PAT_TOKEN }}
```

## The bundle stats workflow

The bundle stats (`bundle-stats.yml`) workflow is intended to help developers keep an eye on the size of their plugins frontend assets. Changes in PRs trigger this workflow which will compare two webpack stats files; one from the default branch and the other from the PR. It then calculates differences between these assets sizes and posts a formatted comment to the PR giving an overview of any size differences.

```yaml title="bundle-stats.yml"
name: Bundle Stats

on:
  workflow_dispatch:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write
  actions: read

jobs:
  compare:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - uses: grafana/plugin-actions/bundle-size@main
```

### Troubleshooting

#### Main stats artifact could not be found

If you see this warning during bundle size workflow runs it means that the workflow failed to find the github artifact that contains the main branch stats file. The file can be generated by either merging a PR to main, pushing a commit to main, or manually running the workflow with workflow_dispatch.
