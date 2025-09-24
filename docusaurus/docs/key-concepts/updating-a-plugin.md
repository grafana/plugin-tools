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

It's important for the health of your Grafana plugin to keep its tooling up to date. Doing so, however, can be a laborious task. To help solve this create-plugin provides the `update` command to help automate:

- **configuration file changes** to take advantage of updates in Grafana, development tooling, and create-plugin
- **dependency updates** to navigate major version bumps in development tooling
- **code refactors** to align with changes to configuration files or major dependency updates

:::info[Git branch status]

We strongly recommend creating a git branch before proceeding. Make sure the current branch has no uncommitted changes. Either stash or commit them first otherwise the update command will exit early.

:::

To update your plugin, run:

<UpdateNPM />

Once finished, we recommend running the various development and build scripts to assert your plugin environment is still operating as expected.

## Options and flags

### `--commit`

The commit flag will, on each successful migration, commit the changes to the current branch. This is useful for debugging and reviewing changes made by the update command.

<UpdateNPMCommit />

### `--force`

Whilst we don't recommend using this the force flag can be used to bypass all safety checks related to uncommitted changes.

<UpdateNPMForce />

## How it works

The update command applies a series of changes (we refer to them as migrations) to your plugin to align it with the latest create-plugin standards. When run it detects the current create-plugin version and determines which migrations need to run to bring your plugin up to date. It then runs each migration sequentially. As each migration runs its name and description are output to the terminal along with a list of any files the migration has changed. If any dependencies are updated by a migration an install will be done to update any lock files. If passed the `--commit` flag after each migration finishes a git commit will be added to the current branch with the name of the migration.

## Automate updates via CI

To make it even easier to keep your plugin up to date, we provide a github workflow that runs the update command and automatically opens a PR if there are any changes. You can follow [these steps](/set-up/set-up-github#the-create-plugin-update-workflow) to enable it in your repository.

## Troubleshooting failed migrations

We try our best to make this process as streamlined as possible, however there could be times where a migration fails. In such cases we recommend using the `--commit` flag to help debug and isolate the issue.
