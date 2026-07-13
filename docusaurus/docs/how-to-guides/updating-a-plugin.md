---
id: updating-a-plugin
title: Automate your plugin updates
description: Learn how to use create-plugin update to automatically update configuration files, workflows, and dependencies.
keywords:
  - grafana
  - plugin
  - update
  - config
  - dependencies
---

import UpdateNPM from '@shared/createplugin-update.md';
import UpdateNPMAgent from '@shared/createplugin-update-agent.md';
import UpdateNPMCommit from '@shared/createplugin-update-commit.md';
import UpdateNPMForce from '@shared/createplugin-update-force.md';

# Automate your plugin updates

It's important for the health of your Grafana plugin to keep its tooling up to date. Doing so, however, can be a laborious task. To help solve this, `create-plugin` provides the `update` command to help you automate tooling updates, including:

- **Configuration file changes** to take advantage of updates in Grafana, development tooling, and create-plugin.
- **Dependency updates** to navigate major version bumps in development tooling.
- **Code refactors** to align with changes to configuration files or major dependency updates.

## Update your plugin

:::info[Git branch status]

Create a Git branch before proceeding. If there are uncommitted changes, stash or commit them first otherwise the update command will exit early.

:::

To update your plugin, run:

<UpdateNPM />

After the update is finished, run your development and build scripts to validate your plugin environment is still operating as expected.

### Options and flags

#### `--commit`

The commit flag will commit the changes to the current branch on each successful migration. This is useful for debugging and reviewing changes made by the update command.

<UpdateNPMCommit />

#### `--force`

The force flag can be used to bypass all safety checks related to uncommitted changes. Use with discretion.

<UpdateNPMForce />

#### `--agent`

Some migrations include instructions for an AI coding agent instead of, or in addition to, an automated code transform. The agent flag controls whether an agent CLI installed on your machine runs those instructions. Pass `--agent=<id>` to use a specific agent, `--agent` to use whichever supported agent is installed, or `--no-agent` to skip agent steps entirely. Supported agents: `claude-code`, `codex`.

<UpdateNPMAgent />

:::note

Always pass the flag with an equals sign (`--agent=claude-code`) and after the `update` command. `create-plugin --agent update` is parsed as a value assignment and runs the wrong command.

:::

### What happens when you update

The update command applies a series of changes, known as migrations, to your plugin to align it with the latest `create-plugin` standards.

When run, it:

- Detects the current create-plugin version.
- Determines which migrations need to run to bring your plugin up to date.
- Runs each migration sequentially.

As each migration runs, its name and description are output to the terminal, along with a list of any files the migration has changed. If a migration updates any dependencies, it will also install and update any lock files.

If you pass the `--commit` flag, after each migration finishes it adds a Git commit to the current branch with the name of the migration.

### AI-assisted migrations

Some changes can't be applied reliably by an automated code transform, for example porting user-authored configuration or refactoring plugin source code. Migrations for such changes ship natural-language instructions that an AI coding agent can apply, either on their own (prompt migrations) or as a follow-up to an automated transform (hybrid migrations).

When the update includes such a migration and a supported agent CLI is installed, `create-plugin` asks whether to run it (or use the [`--agent`](#--agent) flag to decide up front). If you opt in:

- The agent runs in an interactive session: you can watch it work and redirect it at any point.
- Each agent step ends automatically when the agent reports its result. If the update runs without `--commit`, per-migration commits are enabled so each agent step sees an isolated diff; pass `--no-commit` to prevent this.
- If an agent reports failure or its session ends unexpectedly, the update stops (or asks you how to proceed) without recording the update as complete.

If you decline, pass `--no-agent`, or have no supported agent installed, the automated portions of the update still run. The instructions of any skipped agent steps are printed at the end of the update as manual next steps — the update is not blocked by them.

If you run `create-plugin update` from inside an AI agent session (for example, asking Claude Code to update your plugin), `create-plugin` never starts a second agent. Instead it prints the deferred instructions in a machine-readable block for the agent driving your session to complete.

## Automate updates via CI

To make it even easier to keep your plugin up to date, use the provided GitHub workflow that runs the update command and automatically opens a PR if there are any changes. Follow [these steps](/set-up/set-up-github#the-create-plugin-update-workflow) to enable it in your repository.

In CI and other non-interactive environments, AI-assisted migrations are always skipped: automated transforms run as normal, and the instructions of any skipped agent steps are printed to the job log as manual next steps. Passing `--agent` in CI prints a warning and has no other effect.

## Automate dependency updates

`create-plugin` will only update dependencies if they are required for other changes to function correctly. Besides running the update command regularly, use [dependabot](https://docs.github.com/en/code-security/getting-started/dependabot-quickstart-guide) or [renovatebot](https://docs.renovatebot.com/) to keep all dependencies up to date.

## Get help

If you experience issues, [open a bug report](https://github.com/grafana/plugin-tools/issues/new?template=bug_report.yml).
