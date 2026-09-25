# Create Plugin Codemods Guide

This guide provides specific instructions for working with migrations and additions in the create-plugin package.

## Agent Behavior

- Refer to current migrations and additions typescript files found in @./additions/scripts and @./migrations/scripts
- When creating a new migration add it to the end of the exported migrations array in @./migrations/migrations.ts
- Never choose a version for a new migration. Use this `version` line exactly, including the comment, and never paste it into a comment in @./migrations/migrations.ts:

  ```ts
  version: '0.0.0-unreleased', // x-release-please-version
  ```

  release-please replaces it with the released version. The registry tests in @./migrations/migrations.test.ts enforce this

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

## Addition shapes

An addition registry entry in @./additions/additions.ts takes one of three shapes:

- **Script addition** — `scriptPath` only. A codemod applies the change automatically.
- **Prompt addition** — `prompt` only. A Markdown instructions file that an installed AI agent, or the user by hand, applies. Use when the change touches user-authored code or configuration that a codemod cannot transform reliably.
- **Hybrid addition** — `scriptPath` and `prompt`. The codemod applies the deterministic part first, then the agent finishes the parts that depend on user code.

Prefer a script addition whenever the change is mechanically expressible. Reach for a prompt only when judgement over user-authored code is unavoidable.

The registry is annotated `Addition[]` rather than using `satisfies`. With `satisfies` the inferred element type stays the object literal, which stops `isScriptAddition` and `hasPromptStep` narrowing it for consumers.

## Prompt authoring rules

Prompt files live under @./additions/prompts as `<addition-name>.md`, matching the subcommand the user types, and are registered with `prompt: import.meta.resolve('./prompts/<addition-name>.md')`. See @./additions/prompts/example-prompt.md for a template. Rules:

- **Standalone**: when no agent is used the file is surfaced to the user to apply by hand, so it must read as complete manual instructions with no agent-specific context.
- **State the starting state, and check it**: a hybrid prompt is always read on a project where the codemod half has already run, and a user may take the codemod half with `--no-agent` and come back for the agent half later. Start with how to detect that there is nothing to do.
- **No handoff or completion mechanics**: the agent handoff contract is injected by the system prompt at run time and does not exist on the manual path.
- **Bounded scope**: include a "Verify" section (what command proves it worked) and an "Out of scope" section (at minimum: never modify `.config/`).
- **No `toBeIdempotent`**: agent output is not deterministic and cannot be made so, unlike a script codemod. Describe the end state you want and how to confirm it rather than promising a specific diff. What the design guarantees instead is reviewability — the session is interactive, the tree is clean beforehand so `git diff` is exactly the agent's work, and nothing is committed.
- The registry test in @./additions/additions.test.ts asserts every registered `prompt` file exists. Prompt files ship verbatim to `dist` via `copyAssets()` in the root rollup config.
