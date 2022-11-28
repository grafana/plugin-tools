---
id: updating-to-new-releases
title: Updating to New Releases
---

Plugin Tools consists of two packages:

- `create-plugin` is a command-line utility you can use to scaffold new plugins or migrate plugins created with `@grafana/toolkit.
- `sign-plugin` is a command-line utility you can use to sign plugins.

Create Plugin creates the plugin with a script that will always call the latest version of `sign-plugin` (via `npx`) so you’ll get all the new features and improvements automatically.

To update an existing plugin to a newer version of `create-plugin`, [open the changelog](https://github.com/grafana/plugin-tools/blob/main/CHANGELOG.md), find the version you’re currently on and apply the following migration instructions:

```shell
npx @grafana/create-plugin update
```

This command will rerun the original scaffolding commands against the configuration files, dependencies etc. Whilst as much care as possible is taken to ensure this doesn't break things it’s always good to consult the [changelog](https://github.com/grafana/plugin-tools/blob/main/CHANGELOG.md) for potential breaking changes.
