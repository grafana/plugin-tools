---
name: write-codemod
description: Expert at writing migrations and additions for the create-plugin codemod system in packages/create-plugin/src/codemods/. Use this skill whenever the user wants to create, modify, or debug a codemod, migration, or addition in the plugin-tools repo — including replicating a create-plugin template change onto existing plugins, or adding CLI flags to an addition. Triggers on: "write a migration", "add a codemod", "create a migration for X", "add an addition", "update the codemod", or any request to automate a change that plugin authors need to apply to their plugin projects.
---

# Write Codemod

Codemods automate changes to plugin projects scaffolded by `@grafana/create-plugin`. There are two kinds — the first decision is which one to write:

|                | Migration                                                                  | Addition                                                        |
| -------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Purpose        | Bring existing plugins in line with newer create-plugin output             | Opt-in feature an author asks for                               |
| Runs via       | `npx create-plugin update` — automatic, version-gated                      | `npx create-plugin add <name>` — on demand                      |
| Registry entry | `{ name, version, description, scriptPath }` in `migrations/migrations.ts` | `{ name, description, scriptPath }` in `additions/additions.ts` |
| Naming         | `NNN-migration-title` — next number in sequence, ≤3-word kebab-case title  | Descriptive kebab-case — the name becomes the CLI subcommand    |

If the change should reach every plugin on its next update, write a migration. If it's something an author chooses to apply ("externalize the JSX runtime"), write an addition.

## When in doubt, read the source

- The scripts in `migrations/scripts/` and `additions/scripts/` are the ground truth for how `recast`, `yaml`, `jsonc-parser`, and `valibot` are used in this codebase. Read the closest existing example before writing a new one.
- For library APIs the examples don't cover, fetch the docs (context7 MCP server if available, otherwise the package's official documentation). Don't guess from training data.

Before writing any code, present a short plan — target files, applicability and idempotency guards, and the tests that prove each behaviour — and get it confirmed.

## How codemods execute (and why the rules exist)

Both kinds run through the same pipeline in `runner.ts`:

1. Import the script's default export; validate CLI flags against its exported valibot `schema`, if any
2. Call it with a fresh `Context` rooted in the plugin's working directory
3. Format every changed file with the plugin's local prettier (skipped when prettier isn't installed)
4. Flush the context's staged changes to disk
5. Print a summary of changes to the author
6. Run the package manager's install when `package.json` changed

The pipeline explains the core rules:

- **Use the Context for all file operations, never Node.js `fs`.** The runner owns disk writes; the context is an in-memory staging area, which is also what makes tests hermetic. Always `return context`, even on early returns.
- **Don't chase perfect output formatting.** Prettier reformats every changed file afterwards using the plugin's own config.
- **The dependency helpers are enough.** Changing `package.json` through them triggers a real install after the run.
- **Degrade gracefully — don't throw.** A thrown error aborts the author's entire `update` sequence. When a file is missing, unparseable, or already migrated, log with the debug helper and return the context unchanged.
- **Stay inside the plugin's working directory.** Codemods run inside a user's project; the context base path is the boundary.
- **Idempotency is non-negotiable.** Codemods re-run against already-migrated projects; every script must be safe to run repeatedly.
- **One concern per codemod.** Don't bundle unrelated changes.

Migrations run sequentially in ascending version order. With the `--commit` flag, each migration that changed files gets its own commit with the registry `description` as the body — one more reason descriptions must read well.

### Debug logging

Log every early-return path so a codemod that silently no-ops in the field can be diagnosed with `DEBUG=create-plugin:*`:

```ts
import { migrationsDebug } from '../../utils.js'; // additionsDebug for additions

if (!parsed.success) {
  migrationsDebug(`Failed to parse webpack.config.ts: ${parsed.error.message}`);
  return context;
}
```

## Architecture

```
packages/create-plugin/src/codemods/
├── AGENTS.md               # Condensed rules for agents without this skill — keep in sync
├── context.ts              # Context class — ALL file operations go through this
├── runner.ts               # Shared pipeline: validate options → run → format → flush → install
├── schema-parser.ts        # Valibot validation of CLI flags
├── types.ts                # Codemod / CodemodModule types
├── utils.ts                # Helpers: package.json, semver, renderTemplate, debug loggers
├── utils.ast.ts            # recast helpers for TS/JS codemods
├── test-utils.ts           # createDefaultContext() helper for tests
├── migrations/
│   ├── migrations.ts       # Migration registry
│   ├── manager.ts          # Version gating + sequential execution
│   └── scripts/
│       ├── NNN-migration-title.ts
│       └── NNN-migration-title.test.ts
└── additions/
    ├── additions.ts        # Addition registry
    └── scripts/
        ├── addition-name.ts
        └── addition-name.test.ts
```

## Context API

```ts
// Check before touching
context.doesFileExist(filePath: string): boolean       // staged view (includes adds/deletes)
context.doesFileExistOnDisk(filePath: string): boolean

// Read
context.getFile(filePath: string): string | undefined  // returns undefined if deleted
context.readDir(folderPath: string): string[]          // includes context-added files
context.readDirFromDisk(folderPath: string): string[]

// Write
context.addFile(filePath: string, content: string)     // throws if already exists
context.updateFile(filePath: string, content: string)  // throws if doesn't exist; no-ops if content unchanged
context.deleteFile(filePath: string)
context.renameFile(from: string, to: string)           // delete old + add new

// Inspect
context.listChanges(): ContextFile
context.hasChanges(): boolean
```

Always check `doesFileExist` before `getFile` or `updateFile`.

## Utility functions (from `../../utils.js`)

```ts
// package.json manipulation
addDependenciesToPackageJson(context, dependencies, devDependencies?, packageJsonPath?)
removeDependenciesFromPackageJson(context, dependencies, devDependencies?, packageJsonPath?)
readJsonFile<T>(context, path): T  // throws if missing or unparseable

// Semver — handles dist-tags ("latest", "next", "*") and standard ranges
isVersionGreater(incomingVersion, existingVersion, orEqualTo?): boolean

// Render a file from the scaffold templates (see "Rendering scaffold templates")
renderTemplate(templatePath, includeWarning?): string

// Debug loggers (namespace create-plugin:*)
migrationsDebug, additionsDebug
```

## Writing a migration

```ts
import type { Context } from '../../context.js';

export default function migrate(context: Context) {
  // 1. Guard: check the file/condition that makes this migration applicable
  if (!context.doesFileExist('some-file')) {
    return context;
  }

  const content = context.getFile('some-file') || '';

  // 2. Guard: skip if already applied (idempotency)
  if (content.includes('already-migrated-marker')) {
    return context;
  }

  // 3. Apply the change
  context.updateFile('some-file', content.replace('old', 'new'));

  // 4. Always return context
  return context;
}
```

Async is fine — the runner awaits, so the signature may be `async` and return `Promise<Context>`.

### Registering a migration

Add to the end of the `default` array in `migrations/migrations.ts`:

```ts
{
  name: 'NNN-migration-title',
  version: 'X.Y.Z+1',   // next patch from the current @grafana/create-plugin version — see below
  description: 'One sentence explaining WHY this migration is needed (the problem/consequence), not just what it does.',
  scriptPath: import.meta.resolve('./scripts/NNN-migration-title.js'),
},
```

### `version` field — always the next patch

A plugin records the create-plugin version it was last updated to in `.config/.cprc.json`. `update` selects every registered migration whose `version` falls inside the range from that recorded version to the current create-plugin version (inclusive), runs them in ascending order, then bumps `.cprc.json`.

Set `version` to the next **patch** of the current version in `packages/create-plugin/package.json` (e.g. `7.3.0` → `7.3.1`), regardless of the semver bump the change will actually ship in. The registry version only gates which migrations run — it is decoupled from the release version chosen by release-please — and the next patch is the lowest possible next version, so the migration is guaranteed to fire on the next release whatever bump that release turns out to be.

Do not use `LEGACY_UPDATE_CUTOFF_VERSION` for new migrations — that constant is reserved for the original batch written before the "updates as migrations" model.

### `description` field

The `description` is shown to plugin authors during `update` and becomes the commit body with `--commit`. Lead with the problem or consequence (an error code, a deprecation, a breaking change), then briefly note how it's resolved. "Fix X: Y is deprecated causing error Z, replaced with W" beats "Replace Y with W".

## Writing an addition

Additions live in `additions/scripts/` as `addition-name.ts` + `addition-name.test.ts` and register in `additions/additions.ts`:

```ts
{
  name: 'externalize-jsx-runtime',  // the CLI subcommand: npx create-plugin add externalize-jsx-runtime
  description: 'Externalizes the react JSX runtime to help migrate plugins to React 19',
  scriptPath: import.meta.resolve('./scripts/externalize-jsx-runtime.js'),
},
```

There is no `version` field — additions aren't gated. They run whenever an author invokes them, so they must handle any plugin state they might meet: fresh scaffold, heavily customised, or already applied.

### CLI flags via valibot schema

A codemod can accept CLI flags by exporting a valibot `schema` alongside the default function. The runner validates the flags (types, defaults, coercion) before your code runs and reports failures as per-flag error messages:

```ts
import * as v from 'valibot';
import type { Context } from '../../context.js';

export const schema = v.object({
  featureName: v.pipe(v.string(), v.minLength(3, 'Feature name must be at least 3 characters')),
  enabled: v.optional(v.boolean(), true),
});

export default function addFeature(context: Context, options: v.InferOutput<typeof schema>): Context {
  // options are validated and defaulted by the runner
  return context;
}
```

`additions/scripts/example-addition.ts` is the canonical example. `update` forwards CLI flags to migrations the same way, but migrations should rarely take options — they must work unattended.

### Rendering scaffold templates

When a codemod adds a file that also exists in the scaffold templates, render the real template instead of duplicating its content — one source of truth:

```ts
import { fileURLToPath } from 'node:url';
import { renderTemplate } from '../../utils.js';

const templatePath = fileURLToPath(
  new URL('../../../../templates/common/.config/bundler/externals.ts', import.meta.url)
);
context.addFile('.config/bundler/externals.ts', renderTemplate(templatePath, true));
```

## Working from a template change

A common trigger for a migration: the scaffold templates in `packages/create-plugin/templates/` have already been updated, and existing plugins need a codemod that applies the same change. The `update` command only runs migrations — a template change on its own never reaches already-scaffolded plugins.

1. **Treat the template diff as the specification.** Run `git diff main -- packages/create-plugin/templates/` (or read the relevant PR/commits) and enumerate every changed template file before planning the codemod.
2. **Triage each changed file.** Some template changes only matter for new scaffolds (README wording, sample data, docs). List which files need a codemod and which don't, and confirm the split with the user.
3. **Map template paths to scaffolded paths.** The type directory prefix is not part of the scaffolded output path, the `.hbs` extension is stripped, and some filenames are rewritten at scaffold time (see `configFileNamesMap` in `src/utils/utils.files.ts`): `_package.json` → `package.json`, `gitignore` → `.gitignore`, `npmrc` → `.npmrc`, `_eslintrc` → `.eslintrc`, `playwright.config` → `playwright.config.ts`. Templates under `common/` are scaffolded for every plugin type; those under `app/`, `panel/`, `datasource/`, `scenes-app/`, `backend/`, and `backend-app/` only for that type — a change under a type-specific directory needs a matching applicability guard.
4. **Work with rendered output, not template source.** Templates are Handlebars — `{{ pluginId }}` expressions, `{{#if}}` blocks, and partials from `templates/_partials/` never appear in a scaffolded plugin. The codemod must read and write the rendered form, and a change inside a Handlebars conditional needs the equivalent guard in the codemod. When the change adds a whole new file, prefer `renderTemplate` (above) over inlining the content.
5. **Target the intent, not the template text.** An existing plugin's file has usually diverged from the pristine scaffold (renamed variables, extra config, reformatting). Anchor the codemod on the structure the change touches — the AST node, JSON key, or YAML path — with guards for when it's missing, rather than string-replacing the template's old text.
6. **Derive test fixtures from the templates.** Use the old template's rendered output as the happy-path input and assert the result matches what the new template renders. Add cases for divergent user files: the structure moved, the value customized, the file absent.

## Editing files by type

Structured files need parser-based edits — string replacement breaks on formatting differences and is never idempotent. Read the matching reference before writing the transformation:

| Target file type                              | Read                           | Approach                                                    |
| --------------------------------------------- | ------------------------------ | ----------------------------------------------------------- |
| JSON / JSONC (`package.json`, tsconfig, etc.) | `references/json.md`           | `JSON.parse`/`stringify`, helpers, `jsonc-parser` for JSONC |
| TypeScript / JavaScript                       | `references/typescript-ast.md` | recast AST via the `utils.ast.ts` helpers                   |
| YAML (workflows, docker-compose)              | `references/yaml.md`           | `yaml` package document API                                 |
| Plain text / markdown                         | —                              | string operations with an idempotency guard                 |

## Testing requirements

Every codemod ships with a colocated `.test.ts`. Cover four behaviours:

1. **Happy path** — the codemod applies the expected change.
2. **Idempotency** — running twice produces the same result, via the custom matcher (defined in `packages/create-plugin/vitest.setup.ts`; it runs the codemod twice and diffs the files staged after the first run):
   ```ts
   await expect(migrate).toBeIdempotent(context);
   // codemods that take options need a wrapper:
   await expect((ctx) => addFeature(ctx, options)).toBeIdempotent(context);
   ```
3. **Already-migrated guard** — no-op when the change is already present.
4. **Missing file guard** — no-op when the target file doesn't exist (if applicable).

`test-utils.ts` exports `createDefaultContext()` for a context pre-seeded with a minimal plugin; otherwise seed your own:

```ts
import { describe, expect, it } from 'vitest';
import migrate from './NNN-migration-title.js';
import { Context } from '../../context.js';

describe('NNN-migration-title', () => {
  it('should <describe the happy path>', () => {
    const context = new Context('/virtual');
    context.addFile('target-file', 'original content');

    const result = migrate(context);

    expect(result.getFile('target-file')).toBe('expected content');
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile('target-file', 'original content');

    await expect(migrate).toBeIdempotent(context);
  });

  it('should not modify files if already migrated', () => {
    const context = new Context('/virtual');
    const content = 'already-migrated content';
    context.addFile('target-file', content);

    const result = migrate(context);

    expect(result.getFile('target-file')).toBe(content);
  });
});
```

## Verifying before shipping

- Run the codemod's tests from the repo root:
  ```bash
  npm run test -w @grafana/create-plugin -- --run src/codemods/migrations/scripts/NNN-migration-title.test.ts
  ```
- For anything non-trivial, run the codemod against a real plugin: follow "How to test a migration locally" in `packages/create-plugin/CONTRIBUTING.md` (link the local build, check `.config/.cprc.json` is below the bumped version, run `npx create-plugin update` in a test plugin) and inspect the resulting diff.
