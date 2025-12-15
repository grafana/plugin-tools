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

The CI (`ci.yml`) workflow lints, type checks, and builds the frontend and backend. It also runs tests on your plugin every time you push changes to your repository. The `create-plugin` tool helps catch any issues early in the development process, before they become bigger problems. For more information on end-to-end testing as part of the CI workflow, refer to our [documentation](/e2e-test-a-plugin/ci.md).

## The release workflow

To learn how to automate the release process and set up the release workflow, refer to our documentation on [Automate packaging and signing with GitHub CI](/publish-a-plugin/build-automation).

:::warning

This workflow requires a Grafana Cloud API key. Before you begin, follow the instructions for [generating an Access Policy token](/publish-a-plugin/sign-a-plugin#generate-an-access-policy-token).

:::

### Storing your Access Policy token as a repository secret in GitHub

1. **Access Repository Settings**:
   - Go to your GitHub repository.
   - Navigate to the **Settings** tab.

2. In the left sidebar, click on **Secrets and Variables** > **Actions**.
3. Click on the **New repository secret** button.
4. **Add Secret Information**:
   - Enter the name for your secret: `GRAFANA_ACCESS_POLICY_TOKEN`.
   - Paste the Access Policy Token value into the **Secret** field.

5. Click on the **Add secret** button to save the secret.

After you store the secret, you can access it in your GitHub Actions workflow:

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

In this example, the `secrets.GRAFANA_ACCESS_POLICY_TOKEN` variable accesses the stored token securely within your GitHub Actions workflow. Adjust the workflow according to your specific needs and the language or environment you're working with.

### Triggering the workflow

To trigger the release workflow, push a Git tag for the plugin version that you want to release:

```sh
git tag v1.0.0
git push origin v1.0.0
```

## The compatibility check workflow

The compatibility check (`is-compatible.yml`) workflow checks the Grafana API compatibility of your plugin every time you push changes to your repository. This helps catch potential frontend runtime issues before they occur.

The workflow contains the following steps:

1. **Find packages**: Finds `@grafana` npm packages in your plugin.
1. **Extract types**: Extracts the exported types of the specified version.
1. **Compare versions**: Compares the differences between that version and the latest version.
1. **Check usage**: Looks for usages of those changed APIs inside your plugin.
1. **Report issues**: Reports any potential incompatibilities.

## The create plugin update workflow

The create plugin update (`cp-update.yml`) workflow automates keeping your plugin's development environment and dependencies up to date. It periodically checks the latest version of create-plugin listed on the npm registry and compares it to the version used by your plugin. If there's a newer version available, the workflow runs the `create-plugin update` command, updates the frontend dependency lockfile, then creates a PR with the changes for review.

This workflow requires `content`, `pull request` and `workflow` write access to your plugin's repo to push changes and open PRs. Choose from the following two options:

### Personal access token

Create a GitHub [fine-grained personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with access to the plugin repository and permission to read and write `contents`, `pull requests` and `workflows`. Refer to the following screenshot for repository access and permissions.

![](/img/cp-update-pat-permissions.png)

After you create the token, add it to the plugin repository action secrets as `GH_PAT_TOKEN` then pass it to the action:

```yaml
name: Create Plugin Update

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 1 * *' # run once a month on the 1st day

jobs:
  createplugin-update:
    runs-on: ubuntu-latest
    steps:
      - uses: grafana/plugin-actions/create-plugin-update@create-plugin-update/v2.0.1
        with:
          token: ${{ secrets.GH_PAT_TOKEN }}
```

### GitHub app

Alternatively, use a GitHub App, which offers better security and isn't tied to an individual user account.

Follow these steps:

1. [Create a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app).
1. Give it access to your plugins repository with read and write permissions for `contents`, `pull requests` and `workflows`.
1. Install the app in your plugins repo.
1. Generate a private key.
1. Add both the `APP_ID` and the `PRIVATE_KEY` to your repos secrets and use the app token in the workflow like so:

```yaml
name: Create Plugin Update

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 1 * *' # run once a month on the 1st day

jobs:
  createplugin-update:
    runs-on: ubuntu-latest
    steps:
      - name: Generate GitHub App Token
        id: generate_token
        uses: actions/create-github-app-token@v2
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.PRIVATE_KEY }}

      - uses: grafana/plugin-actions/create-plugin-update@create-plugin-update/v2.0.1
        with:
          token: ${{ steps.generate_token.outputs.token }}
```

## The bundle stats workflow

The bundle stats (`bundle-stats.yml`) workflow helps developers monitor the size of their plugin's frontend assets. Changes in PRs trigger this workflow, which compares two webpack stats files: one from the default branch and the other from the PR. It then calculates differences between these asset sizes and posts a formatted comment to the PR with an overview of any size differences.

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

If you see this warning during bundle size workflow runs, it means that the workflow failed to find the GitHub artifact that contains the main branch stats file. You can generate the file by merging a PR to main, pushing a commit to main, or manually running the workflow with `workflow_dispatch`.
