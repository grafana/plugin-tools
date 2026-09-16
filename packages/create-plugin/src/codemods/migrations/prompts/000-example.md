# Example prompt migration

<!--
This file is a reference for authoring prompt and hybrid migrations. It is not
registered in migrations.ts. Copy it to prompts/NNN-migration-title.md and
register it with `prompt: import.meta.resolve('./prompts/NNN-migration-title.md')`.

Authoring contract:
- Write standalone manual instructions. When no AI agent is available the file
  is surfaced to the user as a next-steps item, so it must make sense without
  any agent context.
- Start with an idempotency check. Deferred migrations are version-stamped
  past, so the instructions may be followed on a project where the work is
  already done.
- Never include handoff or completion mechanics. Those are injected by the
  system prompt when an agent runs the migration and do not exist on the
  manual path.
- Bound the scope explicitly. Agents follow "Out of scope" sections; humans
  appreciate them too.
-->

## Context

Explain what changed in create-plugin and why this project needs updating.
For hybrid migrations, describe what the codemod half already did and what is
deliberately left for this step.

## Check first

Describe how to tell whether there is anything to do. If the project is
already in the desired state, stop and report that nothing was needed.

## Steps

1. Concrete, ordered instructions referencing exact file paths.
2. Prefer "port X to Y" over "improve X" — no judgment calls without criteria.
3. If something cannot be migrated mechanically, say what to preserve and how
   to flag it (for example a `TODO` comment) rather than silently dropping it.

## Verify

State the command(s) that prove the migration worked (for example the plugin's
build or test script) and limit fixes to breakage caused by this migration.

## Out of scope

- Do not modify anything under `.config/` (tool-managed).
- Do not upgrade unrelated dependencies or reformat untouched files.
