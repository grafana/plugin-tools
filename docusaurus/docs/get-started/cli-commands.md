---
id: cli-commands
title: Key CLI commands
description: The CLI commands you need to know for plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - create-plugin
  - CLI
  - command line
  - commands
sidebar_position: 3
---

# Key CLI commands

After `create-plugin` has finished, you can run the following built-in commands in the shell:

## <SyncCommand cmd="run dev" />

Builds the plugin in _development mode_ and runs in _watch mode_. Rebuilds the plugin whenever you make changes to the code. You'll see build errors and lint warnings in the console.

## <SyncCommand cmd="run test" />

Runs the tests and watches for changes.

## <SyncCommand cmd="run build" />

Creates a production build of the plugin that optimizes for the best performance. Minifies the build and includes hashes in the filenames.

<h2>
  <code>mage -v</code>
</h2>

Builds backend plugin binaries for Linux, Windows and Darwin.