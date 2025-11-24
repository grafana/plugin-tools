# Create Plugin Codemods Guide

This guide provides specific instructions for working with migrations and additions in the create-plugin package.

## Agent Behavior

- Refer to current migrations and additions typescript files found in @./additions/scripts and @./migrations/scripts
- Always refer to @./context.ts to know what methods are available on the context class
- Always check for file existence using the @./context.ts class before attempting to do anything with it
- Never write files with any 3rd party npm library. Use the context for all file operations
- Always return the context for the next migration/addition
- Test thoroughly using the provided utils in @./test-utils.ts where necessary
- Never attempt to read or write files outside the current working directory

## Migrations

Migrations are automatically run during `create-plugin update` to keep plugins compatible with newer versions of the tooling. They are forced upon developers to ensure compatibility and are versioned based on the create-plugin version. Migrations primarily target configuration files or files that are scaffolded by create-plugin.

### Migration Behavior

- When creating a new migration add it to the exported migrations object in @./migrations/migrations.ts
- Each migration must be idempotent and must include a test case that uses the `.toBeIdempotent` custom matcher found in @../../vitest.setup.ts
- Keep migrations focused on one task

### Migration Naming Conventions

- Each migration lives under @./migrations/scripts
- Migration filenames follow the format: `NNN-migration-title` where migration-title is, at the most, a three word summary of what the migration does and NNN is the next number in sequence based on the current file name in @./migrations/scripts
- Each migration must have:
  - `NNN-migration-title.ts` - main migration logic
  - `NNN-migration-title.test.ts` - migration logic tests
- Each migration should export a default function named "migrate"

## Additions

Additions are optional features that developers choose to add via `create-plugin add`. They are not versioned and can be run at any time to enhance a plugin with new capabilities.

### Addition Behavior

- Additions add new features or capabilities to a plugin (e.g., i18n support, testing frameworks, etc.)
- Each addition must be idempotent - it should be safe to run multiple times
- Always use defensive programming: check if features already exist before adding them
- Use `additionsDebug()` for logging to help with troubleshooting
- If the addition accepts user input, export a `schema` object using `valibot` for input validation
- Each addition should export a default function that takes `(context: Context, options?: T)` and returns `Context`
