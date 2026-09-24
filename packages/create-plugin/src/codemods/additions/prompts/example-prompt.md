# Example addition prompt

<!--
This file is a reference for authoring prompt and hybrid additions. It is not
registered in additions.ts. Copy it to prompts/<addition-name>.md — matching the
subcommand the user types — and register it with
`prompt: import.meta.resolve('./prompts/<addition-name>.md')`.

Authoring contract:
- Write standalone manual instructions. When no agent is available the file is
  surfaced to the user to apply by hand, so it must make sense without any
  agent context.
- State the starting state you expect, and give a way to check it. A hybrid
  addition is always read on a project where the codemod half has already run,
  and a user may take the codemod half with --no-agent and come back for the
  agent half later.
- Never include handoff or completion mechanics. Those are injected by the
  system prompt when an agent runs the addition and do not exist on the manual
  path.
- Bound the scope explicitly. Agents follow "Out of scope" sections; humans
  appreciate them too.
- Agent output is not deterministic, so do not promise a specific diff. Describe
  the end state you want and how to confirm it.
-->

## Context

Explain what this addition adopts and why a plugin would want it. For a hybrid
addition, describe what the codemod half already did and what is deliberately
left for this step.

## Check first

Describe how to tell whether there is anything to do. If the project is already
in the desired state, stop and report that nothing was needed. A re-run is a
normal thing for a user to do.

## Steps

1. Concrete, ordered instructions referencing exact file paths.
2. Prefer "port X to Y" over "improve X" — no judgement calls without criteria.
3. If something cannot be migrated mechanically, say what to preserve and how to
   flag it (for example a `TODO` comment) rather than silently dropping it.

## Verify

State the command(s) that prove the addition worked (for example the plugin's
build or test script) and limit fixes to breakage caused by this addition.

## Out of scope

- Do not modify anything under `.config/` (tool-managed, and overwritten on
  `create-plugin update`).
- Do not change the plugin id or type in `src/plugin.json`.
- Do not upgrade unrelated dependencies or reformat untouched files.
