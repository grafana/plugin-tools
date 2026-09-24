---
id: add-features-to-a-plugin
title: Add features to your plugin
description: Learn how to use the create-plugin add command to adopt an optional feature in an existing Grafana plugin, including additions that an installed AI coding agent applies for you.
keywords:
  - grafana
  - plugin
  - create-plugin
  - add
  - additions
  - ai
  - agent
---

import AddNPM from '@shared/createplugin-add.md';
import AddAgentNPM from '@shared/createplugin-add-agent.md';
import AddNoAgentNPM from '@shared/createplugin-add-no-agent.md';

# Add features to your plugin

The `create-plugin` tool provides two commands that change an existing plugin:

- `update` applies every pending tooling change for your version of the tool. Refer to [Automate your plugin updates](./updating-a-plugin.md).
- `add` applies one named, optional feature that you choose.

Use `add` when you want to adopt something new, such as a different bundler configuration or code generation for a Grafana app plugin.

## Find the available additions

Each optional feature is an addition. To list the additions in your version of the tool, run `add` without a name:

```shell
npx @grafana/create-plugin@latest add
```

To apply one, pass its name:

<AddNPM />

## Before you run the add command

The command stops if there are uncommitted changes in the repository. This is deliberate: it means that `git diff` after the command shows you exactly what changed, so you can review the result before you commit it.

To run the command anyway, use the `--force` flag. The diff then also contains your own uncommitted work.

The command never commits anything. Accepting the change is always a separate step that you control.

## Additions that an AI agent applies

Some changes cannot be automated reliably, because they depend on code that you wrote. Porting your own components to a new API is one example. For these, an addition ships natural-language instructions instead of, or in addition to, a script.

An addition can take one of three forms:

| Form   | What happens                                                                            |
| ------ | --------------------------------------------------------------------------------------- |
| Script | A codemod makes the change. No agent runs.                                              |
| Prompt | An agent applies a Markdown instructions file.                                          |
| Hybrid | A codemod makes the deterministic part of the change, then an agent completes the rest. |

### Use an installed agent

If an addition includes instructions and you have a supported agent CLI installed, `create-plugin` asks whether to use it. Supported agents are Claude Code and OpenAI Codex.

The agent runs in your terminal, so you can watch what it does and redirect it. It reports a summary when it finishes.

To select an agent without the question, use the `--agent` flag:

<AddAgentNPM />

The flag also accepts a path, which lets you use an agent installed outside your `PATH`:

```shell
npx @grafana/create-plugin@latest add <addition> --agent=~/.claude/local/claude
```

:::note

An agent does not produce the same result every time, unlike a script. Review the changes before you commit them. Because the command requires a clean repository and never commits, `git diff` always shows you the agent's work, and `git restore` discards it.

:::

### Apply the instructions yourself

To skip the agent, use the `--no-agent` flag:

<AddNoAgentNPM />

The command applies the automated part of the addition, if there is one, and then prints the path to the instructions file. Every instructions file works as manual instructions, so you can read it and make the changes yourself.

If an addition needs an agent and none is available, the command stops before it writes anything and tells you how to continue.

### Run add from inside an agent session

If you ask your own coding agent to add a feature to your plugin, `create-plugin` detects that it is running inside an agent session. It does not start a second agent. Instead, it applies the automated part of the addition and passes the instructions to the agent that is already running.

To prevent this and get the instructions yourself, use the `--no-agent` flag.

## Reference

For the full list of flags, refer to [CLI commands](../reference/cli-commands.mdx).
