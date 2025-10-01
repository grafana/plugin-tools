---
description: Learn how to use create-plugin update to automatically update configuration files, workflows, and dependencies.
keywords:
  - grafana
  - plugin
  - update
  - config
  - dependencies
---

import UpdateNPM from '@shared/createplugin-update.md';
import UpdateNPMCommit from '@shared/createplugin-update-commit.md';
import UpdateNPMForce from '@shared/createplugin-update-force.md';

# Automate updating your plugin

It's important for the health of your Grafana plugin to keep its tooling up to date. Doing so, however, can be a laborious task. To help solve this, `create-plugin` provides the `update` command to help you automate tooling update:

- **configuration file changes** to take advantage of updates in Grafana, development tooling, and create-plugin
- **dependency updates** to navigate major version bumps in development tooling
- **code refactors** to align with changes to configuration files or major dependency updates

:::info[Git branch status]

Create a git branch before proceeding. If there are uncommitted changes, stash or commit them first otherwise the update command will exit early.

:::

To update your plugin, run:

<UpdateNPM />

After the update is finished, run the various development and build scripts to validate your plugin environment is still operating as expected.

## Options and flags

### `--commit`

The commit flag will, on each successful migration, commit the changes to the current branch. This is useful for debugging and reviewing changes made by the update command.

<UpdateNPMCommit />

### `--force`

The force flag can be used to bypass all safety checks related to uncommitted changes. Use with discretion.

<UpdateNPMForce />

## How it works

The update command applies a series of changes, known as migrations, to your plugin to align it with the latest 'create-plugin' standards.

When run, it:

- Detects the current create-plugin version
- Determines which migrations need to run to bring your plugin up to date
- Runs each migration sequentially

As each migration runs, its name and description are output to the terminal, along with a list of any files the migration has changed. If a migration updates any dependencies, it will also install and update any lock files.

If you pass the `--commit` flag, after each migration finishes it adds a Git commit to the current branch with the name of the migration.

## Automate updates via CI

To make it even easier to keep your plugin up to date, we provide a GitHub workflow that runs the update command and automatically opens a PR if there are any changes. You can follow [these steps](/set-up/set-up-github#the-create-plugin-update-workflow) to enable it in your repository.

## Automate dependency updates

`create-plugin` will only update dependencies if they are required for other changes to function correctly. Besides running the update command regularly, use [dependabot](https://docs.github.com/en/code-security/getting-started/dependabot-quickstart-guide) or [renovatebot](https://docs.renovatebot.com/) to keep all dependencies up to date.

## Getting help

If you experience issues, please [open a bug report](https://github.com/grafana/plugin-tools/issues/new?template=bug_report.yml).
