---
id: build-automation
title: Automate your plugin builds
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

# Automate the packaging and signing of your plugin with GitHub CI

Set up your plugin to use the supplied [GitHub workflows](../set-up/set-up-github) from [create-plugin](../get-started.md) to ensure that your plugin builds and packages in the correct format. Additionally, you can use the zip file that this workflow produces to test the plugin. 

If you include a Grafana Access Policy Token in your [GitHub repository secrets](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/managing-development-environment-secrets-for-your-repository-or-organization), the system automatically creates a signed build that you can use to test the plugin locally before submission. For information about how to create this token, refer to the [sign a plugin](./sign-a-plugin.md#generate-an-access-policy-token) documentation.

When you create a release tag, the process becomes automated and results in a zip file that you can submit for publication to the [Grafana plugin catalog](https://grafana.com/plugins).

You can use the links to the archive and zip files from the release page to make your plugin submission.

## Package your plugin with GitHub CI

Follow these steps to package your plugin with GitHub CI. 

To package your plugin in a ZIP file manually, refer to [Package a plugin](./package-a-plugin.md).

### Set up the release workflow

Ensure your repository contains a `.github/workflows/release.yml` file with the following contents:

```yaml
# filepath: .github/workflows/release.yml
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
          # refer to https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin#generate-an-access-policy-token to generate it
          # save the value in your repository secrets
          policy_token: ${{ secrets.GRAFANA_ACCESS_POLICY_TOKEN }}
          # creates a signed build provenance attestation to verify the authenticity of the plugin build
          attestation: true
```

### Trigger the release workflow

To trigger the release workflow, push a tag with the format `vX.X.X` to the repository. Typically, you merge all of your changes into `main`, and you apply the tag to `main`.

#### Create a `vX.X.X` tag with your package manager (recommended)

Use your package manager to create a version tag.

The following examples create a patch version following [Semantic Versioning](https://semver.org/):

With [npm](https://docs.npmjs.com/cli/v7/commands/npm-init):

```sh
npm version patch
```

With [yarn](https://yarnpkg.com/lang/en/docs/cli/version/):

```sh
yarn version patch
```

With [pnpm](https://pnpm.io/):

```sh
pnpm version patch
```

This updates your version in the `package.json` file and creates a new Git tag with the format `vX.X.X`. You can change `patch` to `minor` or `major` to create a new minor or major version.

After you create the tag, push it to the repository:

```sh
git push origin main --follow-tags
```

### Publish your release in GitHub

After you [create and push the tag](#trigger-the-release-workflow), the release workflow runs and generates a release with all the artifacts you need to submit your plugin to the [Grafana plugin catalog](https://grafana.com/plugins).

The workflow creates a **draft release**. You can edit the release in GitHub, update the description as needed, and then publish it. For more details about managing repository releases, refer to the [GitHub documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

### Use your release assets for your plugin submission

After you publish the draft release, you can use the release assets to submit your plugin to the [Grafana plugin catalog](https://grafana.com/plugins). Copy the links to the archive (zip) file and sha1 sum and use them in the plugin submission form.

### Download the release zip file

Access the release zip file directly from the GitHub repository release path (for example, `https://github.com/org/plugin-id/releases`).

## Sign your plugin automatically

You can sign your plugin releases using GitHub Action. 

First, [generate an Access Policy Token](./sign-a-plugin.md#generate-an-access-policy-token) and [save it in your repository secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) as `GRAFANA_ACCESS_POLICY_TOKEN`.

By default, create-plugin adds the following `release.yml` to your scaffolded plugin. If this is missing from your plugin repository, copy the following to add the workflow:

```yaml
# filepath: .github/workflows/release.yml
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
          # refer to https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin#generate-an-access-policy-token to generate it
          # save the value in your repository secrets
          policy_token: ${{ secrets.GRAFANA_ACCESS_POLICY_TOKEN }}
          attestation: true
          use_changelog_generator: true # Enable automatic changelog generation
```

Next, follow the regular process to [trigger](#trigger-the-release-workflow) the release workflow. Your plugin is signed automatically, and you can use the release assets for your plugin submission.

## Attest provenance for plugin builds

Provenance attestation generates verifiable records of the build's origin and process and enhances the security of your plugin builds. With this feature, users can confirm that the plugin they're installing was created through your official build pipeline.

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

The workflow generates attestations automatically when it builds your plugin zip file.

### Troubleshoot provenance attestation

If you encounter errors in the plugin validator or your plugin submission like these:

- "No provenance attestation. This plugin was built without build verification."
- "Cannot verify plugin build."

Follow the steps in the [Enable provenance attestation](#enable-provenance-attestation) section to enable provenance attestation in your GitHub Actions workflow.

## Generate changelogs automatically 

Maintaining a detailed changelog is essential for communicating updates to your users and displays prominently in the Grafana plugin details page. To simplify this process, our plugin build workflow supports automatic changelog generation.

### Use the GitHub Actions workflow to generate changelog

The build-plugin GitHub Action can automatically generate and maintain your plugin's changelog using the [github-changelog-generator](https://github.com/github-changelog-generator/github-changelog-generator) tool. This feature:

- Creates a comprehensive `CHANGELOG.md` file organized by release.
- Groups changes by type (features, bug fixes, and more).
- Includes links to pull requests and issues.
- Acknowledges contributors.
- Commits the updated changelog to your repository.

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

The changelog generator requires write access to commit the updated `CHANGELOG.md` file to your repository.

If your target branch is protected, the default `github.token` can't push changes directly, even with write permissions. In this case, you need to:

1. Create a Personal Access Token (PAT) with appropriate permissions.
1. Store it as a repository secret (for example, `CHANGELOG_PAT`).
1. Configure the action to use this token:

```yaml
- name: Build plugin
  uses: grafana/plugin-actions/build-plugin@main
  with:
    use_changelog_generator: true
    token: ${{ secrets.CHANGELOG_PAT }} # Replace default github.token
```

### Generated changelog format

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

Your plugin is now packaged and signed. 

You can now proceed to [publish your plugin](./publish-or-update-a-plugin.md), or [install a packaged plugin](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-a-packaged-plugin).
