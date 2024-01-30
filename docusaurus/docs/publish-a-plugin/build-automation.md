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

We recommend setting up your plugin to use the supplied [Github workflows](../create-a-plugin/develop-a-plugin/set-up-github-workflows.md) from [create-plugin](../get-started/get-started.mdx)
to ensure that your plugin will be built and packaged in the correct format.

To do so, refer to [these docs](https://github.com/grafana/plugin-actions/blob/main/build-plugin/README.md).

Additionally, we recommend using the zip file produced from this workflow to test the plugin.

If a Grafana Access Policy Token is included in your [Github repository secrets](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/managing-development-environment-secrets-for-your-repository-or-organization), a signed build is automatically created, which you can use to test the plugin locally before submission.

By creating a release tag, the whole process becomes automated, resulting in a zip file that you can submit for publication to the [Grafana plugin catalog](https://grafana.com/plugins)

The zip file can be downloaded from the summary page of the CI workflow.

## Create a release tag

A tag with the format `vX.X.X` is used to trigger the release workflow. Typically all of your changes will be merged into `main`, and the tag is applied to `main`

```BASH
git checkout main
git pull origin main
git tag v2.0.1
git push origin v2.0.1
```

If you need to re-tag the release, the current tag can be removed with these commands:

```BASH
git tag -d v2.0.1
git push --delete origin v2.0.1
git checkout main
git pull origin main
```

After you push the tag, you can create the same tag again.

## Download the release zip file

Access the final release zip file directly from the GitHub repository release path (e.g. https://github.com/org/plugin-id/releases).

## Next steps

When you've packaged your plugin, proceed to [publishing a plugin](./publish-or-update-a-plugin.md) or [installing a packaged plugin](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-a-packaged-plugin).
