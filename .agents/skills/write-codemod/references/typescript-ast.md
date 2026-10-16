# Modifying TypeScript / JavaScript files

Always use AST manipulation for `.ts` and `.js` files. Never use string replacement or regex on source code — it breaks on formatting differences and is not idempotent by nature.

The codemod system uses [`recast`](https://github.com/benjamn/recast) with a TypeScript parser via helpers in `../../utils.ast.js`. Read `utils.ast.ts` and `utils.ast.test.ts` for the full helper API.

## Available helpers

```ts
import {
  parseAsTypescript, // parse TS/JS source → AST (returns discriminated union)
  printAST, // print AST back to source string
  findVariableDeclaration, // find a VariableDeclarator by name
  findObjectProperty, // find a property in an ObjectExpression
  isProperty, // type guard: Property | ObjectProperty
  createImport, // build an ImportDeclaration node
  insertImports, // insert ImportDeclarations after the last existing import
} from '../../utils.ast.js';

// recast builders for constructing new AST nodes
import * as recast from 'recast';
const { builders } = recast.types;
```

## Core pattern: parse → navigate → mutate → print

```ts
import { migrationsDebug } from '../../utils.js';

const source = context.getFile('some-file.ts') || '';
const parsed = parseAsTypescript(source);

// Always handle parse failure — degrade gracefully and leave a trace
if (!parsed.success) {
  migrationsDebug(`Failed to parse some-file.ts: ${parsed.error.message}`);
  return context;
}

// Navigate and mutate the AST...

context.updateFile('some-file.ts', printAST(parsed.ast));
```

`printAST` uses these defaults (override via second arg if needed):

- `tabWidth: 2`, `trailingComma: true`, `quote: 'single'`

## Pattern: add an import

```ts
// Idempotency guard: check the source string before parsing
const source = context.getFile('webpack.config.ts') || '';
if (source.includes("from '../bundler/externals.ts'")) {
  return context;
}

const parsed = parseAsTypescript(source);
if (!parsed.success) {
  return context;
}

const importDec = createImport({ named: [{ name: 'externals' }] }, '../bundler/externals.ts');
insertImports(parsed.ast, [importDec]);
context.updateFile('webpack.config.ts', printAST(parsed.ast));
```

## Pattern: find and modify an object property

```ts
const parsed = parseAsTypescript(source);
if (!parsed.success) {
  return context;
}

const baseConfig = findVariableDeclaration(parsed.ast, 'baseConfig');
if (!baseConfig || baseConfig.init?.type !== 'ObjectExpression') {
  return context;
}

const externals = findObjectProperty(baseConfig.init, 'externals');
if (externals && isProperty(externals)) {
  externals.value = builders.identifier('myNewValue');
  context.updateFile('webpack.config.ts', printAST(parsed.ast));
}
```

## Pattern: traverse and visit nodes

For transformations not covered by the helpers, use `recast.types.visit` directly:

```ts
import * as recast from 'recast';

recast.types.visit(parsed.ast, {
  visitImportDeclaration(path) {
    if (path.node.source.value === 'old-package') {
      path.node.source = builders.literal('new-package');
    }
    return this.traverse(path);
  },
});
```

## Idempotency

Before mutating, check whether the change is already present. The cheapest guard is a string check on the raw source before parsing:

```ts
const source = context.getFile('target.ts') || '';
if (source.includes('already-applied-marker')) {
  return context; // skip parse + traverse entirely
}
```

For structural checks (e.g. an import already exists with the right specifiers), check the AST after parsing.
