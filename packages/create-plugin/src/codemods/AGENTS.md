# Create Plugin Codemods Guide

This guide provides specific instructions for working with migrations and additions in the create-plugin package.

## Migration shapes

A migration registry entry in @./migrations/migrations.ts takes one of three shapes:

- **Script migration** — `scriptPath` only. A codemod applies the change automatically.
- **Prompt migration** — `prompt` only. A Markdown instructions file that an installed AI agent (or the user, manually) applies. Use when the change touches user-authored code or configuration that a codemod cannot transform reliably.
- **Hybrid migration** — `scriptPath` and `prompt`. The codemod applies the deterministic part first; the agent finishes the parts that depend on user code.

Prefer a script migration whenever the change is mechanically expressible. Reach for a prompt only when judgment over user-authored code is unavoidable.

## Agent Behavior

- Refer to current migrations and additions typescript files found in @./additions/scripts and @./migrations/scripts
- When creating a new migration add it to the exported migrations object in @./migrations/migrations.ts
- Always refer to @./context.ts to know what methods are available on the context class
- Always check for file existence using the @./context.ts class before attempting to do anything with it
- Never write files with any 3rd party npm library. Use the context for all file operations
- Always return the context for the next migration
- Test thoroughly using the provided utils in @./test-utils.ts where necessary
- Each migration must be idempotent and must include a test case that uses the `.toBeIdempotent` custom matcher found in @../../vitest.setup.ts
- Keep migrations focused on one task
- Never attempt to read or write files outside the current working directory

## Naming Conventions

- Each migration lives under @./migrations/scripts
- Migration filenames follow the format: `NNN-migration-title` where migration-title is, at the most, a three word summary of what the migration does and NNN is the next number in sequence based on the current file name in @./migrations/scripts
- Each migration must have:
  - `NNN-migration-title.ts` - main migration logic
  - `NNN-migration-title.test.ts` - migration logic tests
- Each migration should export a default function named "migrate"

## Prompt authoring rules

Prompt files live under @./migrations/prompts as `NNN-migration-title.md` (same `NNN` as the script for hybrid migrations) and are registered with `prompt: import.meta.resolve('./prompts/NNN-migration-title.md')`. See @./migrations/prompts/000-example.md for a template. Rules:

- **Standalone**: when no agent is available the file is surfaced to the user as a manual next step, so it must read as complete manual instructions with no agent-specific context.
- **Idempotency check first**: deferred prompt migrations are version-stamped past, so the instructions may be followed on a project where the work is already done. Start with how to detect that nothing needs doing.
- **No handoff or completion mechanics**: the agent handoff contract is injected by the system prompt at run time and does not exist on the manual path.
- **Bounded scope**: include a "Verify" section (what command proves it worked) and an "Out of scope" section (at minimum: never modify `.config/`).
- The registry test in @./migrations/migrations.test.ts asserts every registered `prompt` file exists; prompt files ship verbatim to dist via the root rollup config.
