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

# Automate packaging and signing with CI

If your plugin has been set up to use the supplied [Git workflows](../create-a-plugin/develop-a-plugin/set-up-github-workflows.md) from [create-plugin](../get-started/get-started.mdx),
the plugin should be built and packaged in the correct format.

If you need to set up the git worklows, see [these docs](https://github.com/grafana/plugin-actions/blob/main/build-plugin/README.md)

We recommend using the ZIP file produced from this workflow to test the plugin.

If a signing key is included in the Git repo, a signed build is automatically created, which you can use to test the plugin locally before submission.

By creating a release tag, the whole process becomes automated, resulting in a ZIP file that you can submit for publication in the [Grafana plugin catalog](https://grafana.com/plugins)

## Create a release tag

A tag with the format `vX.X.X` is used to trigger the release workflow. Typically all of your changes will be merged into `main`, and the tag is applied to `main`

```BASH
git checkout main
git pull origin main
git tag v2.0.1
git push origin v2.0.1
```

If you need to re-tag the release, the current tag can be removed by issuing the commands:

```BASH
git tag -d v2.0.1
git push --delete origin v2.0.1
git checkout main
git pull origin  main
```

Once the push is made, you can create the same tag again.

## Downloading the release zip file

Access the final release zip file directly from the git repo release path.

[Link to generated ZIP](https://github.com/briangann/grafana-gauge-panel/releases/download/v2.0.1/briangann-gauge-panel-2.0.1.zip)

## Next Steps

When you've packaged your plugin, proceed to [publishing a plugin](./publish-or-update-a-plugin.md) or [installing a packaged plugin](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-a-packaged-plugin).
