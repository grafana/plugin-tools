# Modifying JSON and JSONC files

Use `JSON.parse` / `JSON.stringify` for all JSON file manipulation. Never use string replacement or regex on JSON — it breaks on formatting differences and is not idempotent.

## Reading

Prefer the `readJsonFile<T>` helper from `../../utils.js` — it throws a clear error if the file is missing or unparseable:

```ts
import { readJsonFile } from '../../utils.js';

const pkg = readJsonFile<{ devDependencies?: Record<string, string> }>(context, 'package.json');
```

## Writing

Serialize with 2-space indent to match the existing format (the runner's prettier pass normalizes the rest):

```ts
context.updateFile('some-config.json', JSON.stringify(updatedObj, null, 2));
```

## package.json dependencies

Always use the purpose-built helpers rather than manipulating the object directly — they handle sorting, deduplication, and version comparison, and the runner triggers a real install when they change `package.json`:

```ts
import { addDependenciesToPackageJson, removeDependenciesFromPackageJson } from '../../utils.js';

addDependenciesToPackageJson(context, {}, { 'new-dev-dep': '^1.0.0' });
removeDependenciesFromPackageJson(context, [], ['old-dep']);
```

## Idempotency

Check whether the key or value is already present before writing:

```ts
const config = readJsonFile<{ compilerOptions?: { target?: string } }>(context, 'tsconfig.json');
if (config.compilerOptions?.target === 'ES2022') {
  return context; // already applied
}
```

## JSONC files (JSON with comments)

Some scaffolded config files (e.g. `.config/tsconfig.json`) are JSONC — they have a block-comment header that `JSON.parse` cannot handle. Use `jsonc-parser` (already a dependency) for these files. Its `modify` + `applyEdits` API edits the source string in-place, preserving comments and formatting:

```ts
import { modify, applyEdits } from 'jsonc-parser';

const content = context.getFile('.config/tsconfig.json') || '';

// Idempotency guard before touching the file
if (!content.includes('"someKey"')) {
  return context;
}

const formattingOptions = { formattingOptions: { insertSpaces: true, tabSize: 2 } };

// Remove a key (pass undefined as value)
const withoutKey = applyEdits(content, modify(content, ['compilerOptions', 'someKey'], undefined, formattingOptions));

// Add/update a nested key — chain onto the previous result so offsets stay correct
const withNewKey = applyEdits(
  withoutKey,
  modify(withoutKey, ['compilerOptions', 'paths', '*'], ['../src/*'], formattingOptions)
);

context.updateFile('.config/tsconfig.json', withNewKey);
```

Key points:

- `modify` with `undefined` as value removes the key and fixes surrounding commas.
- Each `modify` call must operate on the current string (not the original) — chain `applyEdits` results when making multiple edits to the same object, because removing a key shifts the offsets of everything after it.
- To add a single key inside an existing object without replacing the whole object, use the full path: `['compilerOptions', 'paths', '*']` rather than `['compilerOptions', 'paths']`.
