---
id: build-automation
title: Automate plugin builds
sidebar_position: 1
description: Automate Grafana plugin builds and releases
keywords:
  - grafana
  - plugins
  - plugin
  - automation
  - build
  - automate
  - builds
---

# Automate packaging and signing with GitHub CI

We recommend setting up your plugin to use the supplied [Github workflows](../get-started/set-up-development-environment.mdx#set-up-github-workflows) from [create-plugin](../get-started/get-started.mdx)
to ensure that your plugin will be built and packaged in the correct format.

Additionally, we recommend using the zip file produced from this workflow to test the plugin.

If a Grafana Access Policy Token is included in your [Github repository secrets](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/managing-development-environment-secrets-for-your-repository-or-organization), a signed build is automatically created, which you can use to test the plugin locally before submission. The [sign a plugin](./sign-a-plugin.md#generate-an-access-policy-token) documentation includes guidance on how to create this token.

By creating a release tag, the whole process becomes automated, resulting in a zip file that you can submit for publication to the [Grafana plugin catalog](https://grafana.com/plugins)

You can use the links to the archive and zip files from the release page to make your plugin submission.

## Setup the release workflow

Ensure your repository contains a `.github/workflows/release.yml` file with the following contents:

```yaml title=".github/workflows/release.yml"
name: Release

on:
  push:
    tags:
      - 'v*' # Run workflow on version tags, e.g. v1.0.0.

jobs:
  release:
    permissions:
      id-token: write
      contents: write
      attestations: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: grafana/plugin-actions/build-plugin@main
        with:
          # see https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin#generate-an-access-policy-token to generate it
          # save the value in your repository secrets
          policy_token: ${{ secrets.GRAFANA_ACCESS_POLICY_TOKEN }}
          # creates a signed build provenance attestation to verify the authenticity of the plugin build
          attestation: true
```

## How to trigger the release workflow

To trigger the release workflow you need to push a tag with the format `vX.X.X` to the repository. Typically all of your changes will be merged into `main`, and the tag is applied to `main`

### Create a `vX.X.X` tag with your package manager (Recommended)

The easiest way to create a version tag is using your package manager.

In the following examples a patch version (following [Semantic Versioning](https://semver.org/)) is created:

with [npm](https://docs.npmjs.com/cli/v7/commands/npm-init):

```
npm version patch
```

with [yarn](https://yarnpkg.com/lang/en/docs/cli/version/):

```
yarn version patch
```

with [pnpm](https://pnpm.io/):

```
pnpm version patch
```

This updates your version in the `package.json` file and creates a new Git tag with the format `vX.X.X`. You can change `patch` to `minor` or `major` if you want to create a new minor or major version.

After creating the tag, push it to the repository:

```bash
git push origin main --follow-tags
```

## Publish your release in Github

After you [create and push the tag](#how-to-trigger-the-release-workflow), the release workflow will run, generating a release with all the artifacts needed to submit your plugin to the [Grafana plugin catalog](https://grafana.com/plugins).

The workflow creates a **draft release**. You can edit the release in GitHub, update the description as needed, and then publish it. For more details on managing repository releases, refer to the [GitHub documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

## Use your release assets for your plugin submission

Once the draft release is published, you can use the release assets to submit your plugin to the [Grafana plugin catalog](https://grafana.com/plugins). Simply copy the links to the archive (zip) file and sha1 sum. Use these in the plugin submission form.

## Download the release zip file

Access the release zip file directly from the GitHub repository release path (for example, `https://github.com/org/plugin-id/releases`).

## Signing your plugin automatically

You can sign your plugin releases using the Github Action. First you will have to [Generate an Access Policy Token](./sign-a-plugin.md#generate-an-access-policy-token) and [save it in your repository secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

Save your Access Policy Token as `GRAFANA_ACCESS_POLICY_TOKEN`.

By default, create-plugin will add the following `release.yml` to your scaffolded plugin with the following contents. If this is missing from your plugin repository, copy the following to add the workflow:

```yaml title=".github/workflows/release.yml"
name: Release

on:
  push:
    tags:
      - 'v*' # Run workflow on version tags, e.g. v1.0.0.

jobs:
  release:
    permissions:
      id-token: write
      contents: write
      attestations: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: grafana/plugin-actions/build-plugin@main
        with:
          # see https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin#generate-an-access-policy-token to generate it
          # save the value in your repository secrets
          policy_token: ${{ secrets.GRAFANA_ACCESS_POLICY_TOKEN }}
          attestation: true
          use_changelog_generator: true # Enable automatic changelog generation
```

Then, follow the regular process to [trigger](#how-to-trigger-the-release-workflow) the release workflow. Your plugin will be signed automatically, and you can use the release assets for your plugin submission.

## Provenance attestation for plugin builds

Provenance attestation, that is, _a feature that generating verifiable records of the build's origin and process_, enhances the security of your plugin builds. This feature allows users to confirm that the plugin they are installing was created through your official build pipeline.

Currently, this feature is available only with GitHub Actions in public repositories. While we recommend using GitHub Actions with provenance attestation for improved security, you can still build and distribute plugins using other CI/CD platforms or manual methods.

### Enable provenance attestation

To enable provenance attestation in your existing GitHub Actions workflow:

1. Add required permissions to your workflow job:

```yaml
permissions:
  id-token: write
  contents: write
  attestations: write
```

2. Enable attestation in the `build-plugin` action:

```yaml
- uses: grafana/plugin-actions/build-plugin@main
  with:
    policy_token: ${{ secrets.GRAFANA_ACCESS_POLICY_TOKEN }}
    attestation: true
```

The workflow will generate attestations automatically when building your plugin zip file.

### Troubleshoot provenance attestation

If you encounter errors in the plugin validator or your plugin submission like these:

- "No provenance attestation. This plugin was built without build verification."
- "Cannot verify plugin build."

Follow the steps above to enable provenance attestation in your GitHub Actions workflow.

## Automatically Generate Changelogs

Maintaining a detailed changelog is essential for communicating updates to your users and is displayed prominently in the Grafana plugin details page. To simplify this process, our plugin build workflow supports automatic changelog generation.

### Using the GitHub Actions Workflow for Changelog Generation

The build-plugin GitHub Action can automatically generate and maintain your plugin's changelog using the [github-changelog-generator](https://github.com/github-changelog-generator/github-changelog-generator) tool. This feature:

1. Creates a comprehensive CHANGELOG.md file organized by release
1. Groups changes by type (features, bug fixes, etc.)
1. Includes links to pull requests and issues
1. Acknowledges contributors
1. Commits the updated changelog to your repository

To enable automatic changelog generation in your workflow, add the `use_changelog_generator: true` parameter to your build-plugin action:

```yaml
- uses: grafana/plugin-actions/build-plugin@main
  with:
    policy_token: ${{ secrets.GRAFANA_ACCESS_POLICY_TOKEN }}
    attestation: true
    use_changelog_generator: true # Enable automatic changelog generation
```

### Requirements

To use this feature, ensure your workflow has the necessary permissions:

```yaml
permissions:
  contents: write
```

The changelog generator requires write access to commit the updated CHANGELOG.md file to your repository.

If your target branch is protected, the default github.token cannot push changes directly, even with write permissions. In this case, you need to:

1. Create a Personal Access Token (PAT) with appropriate permissions
1. Store it as a repository secret (e.g., CHANGELOG_PAT)
1. Configure the action to use this token:

```yaml
- name: Build plugin
  uses: grafana/plugin-actions/build-plugin@main
  with:
    use_changelog_generator: true
    token: ${{ secrets.CHANGELOG_PAT }} # Replace default github.token
```

### Generated Changelog Format

The generated changelog follows a standardized format that clearly categorizes changes:

```markdown
## [1.2.0](https://github.com/user/plugin-name/tree/1.2.0) (2025-03-15)

**Implemented enhancements:**

- Add dark theme support [\#138](https://github.com/user/plugin-name/pull/138) ([username](https://github.com/username))
- Add tooltip customization options [\#135](https://github.com/user/plugin-name/pull/135) ([username](https://github.com/username))

**Fixed bugs:**

- Fix panel crash when switching dashboards [\#139](https://github.com/user/plugin-name/pull/139) ([username](https://github.com/username))
- Fix time zone handling inconsistencies [\#134](https://github.com/user/plugin-name/pull/134) ([username](https://github.com/username))

**Closed issues:**

- Documentation needs more examples [\#130](https://github.com/user/plugin-name/issues/130)

**Merged pull requests:**

- Update dependencies for security [\#140](https://github.com/user/plugin-name/pull/140) ([username](https://github.com/username))
```

## Next steps

When you've packaged your plugin, proceed to [publishing a plugin](./publish-or-update-a-plugin.md) or [installing a packaged plugin](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-a-packaged-plugin).
