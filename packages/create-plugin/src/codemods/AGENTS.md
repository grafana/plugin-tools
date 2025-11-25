# Create Plugin Codemods Guide

This guide provides specific instructions for working with migrations and additions in the create-plugin package.

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
