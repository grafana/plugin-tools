---
id: updating-to-new-releases
title: Updating to New Releases
---

To update an existing plugin to a newer version of `create-plugin` run the following migration command:

```shell
npx @grafana/create-plugin update
```

This command will rerun the original scaffolding commands against the configuration files, dependencies, and scripts, using the latest version of `create-plugin`. It will prompt to confirm any destructive operations are agreed to prior to being run.

:::tip
It's recommended that all prompts are agreed to so configs, dependencies and scripts are kept in sync. Due to their destructive nature the default for each of the following prompts is `no`.
:::

## Prompts

### Would you like to update the project's configuration?

Selecting `y` will replace the files inside the `.config` directory to make sure the plugin is built and tested with the latest Grafana recommended configurations.

### Would you like to update the following dependencies in the package.json?

This step is skipped if there are no dependencies to update otherwise select from the following choices:

- Selecting `Yes, all of them` will update all existing dependencies and add any missing dependencies to `package.json`.
- Selecting `Yes, but only the outdated ones` will update all existing dependencies in `package.json`.
- Selecting `No` will skip this step preventing any dependency updates.

### Would you like to update the `scripts` in your `package.json`? All scripts using grafana-toolkit will be replaced.

This step will update any npm scripts in the `package.json` file to match the latest configurations. Any scripts that were previously using `grafana-toolkit` will be replaced.

:::caution
Whilst as much care as possible is taken to ensure this doesn't break things it’s always good to consult the [changelog](https://github.com/grafana/plugin-tools/blob/main/CHANGELOG.md) for potential breaking changes.
:::
