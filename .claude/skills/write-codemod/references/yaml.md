# Modifying YAML files

Use the `yaml` npm package for structured manipulation of `.yml` / `.yaml` files. Never use string replacement on YAML — it breaks on formatting and comment differences.

```ts
import { parseDocument, stringify, visit, YAMLMap, YAMLSeq, Scalar, Pair, type Document } from 'yaml';
```

Note: migrations that modify YAML may be `async` — the codemod signature allows returning `Promise<Context>`, and the existing YAML examples use `async function migrate`.

## Core pattern: parse → navigate → mutate → stringify

```ts
const source = context.getFile('docker-compose.yaml') || '';
const doc = parseDocument(source);

// navigate with path arrays
const value = doc.getIn(['services', 'grafana', 'image']); // read
doc.setIn(['services', 'grafana', 'image'], 'grafana/grafana:latest'); // write
doc.deleteIn(['services', 'grafana', 'build']); // delete
doc.addIn(['services', 'grafana', 'extends'], { file: 'base.yaml' }); // add

context.updateFile('docker-compose.yaml', stringify(doc));
```

`stringify` options used in existing migrations: `{ lineWidth: 120, singleQuote: true }`.

## Type guards for traversal

```ts
import { YAMLMap, YAMLSeq, Scalar, Pair } from 'yaml';

node instanceof YAMLMap; // key-value mapping (object)
node instanceof YAMLSeq; // sequence (array)
node instanceof Scalar; // scalar value (string, number, bool)
node instanceof Pair; // key-value pair within a map
```

## Pattern: traverse and visit nodes

```ts
visit(doc, {
  Pair: ((_key, pair, path) => {
    if (pair.key instanceof Scalar && pair.key.value === 'uses') {
      pair.value = new Scalar('grafana/plugin-actions/is-compatible@main');
    }
  }) as visitorFn<Pair<unknown, unknown>>,
});
```

Return `visit.REMOVE` from a visitor to delete the current node.

## Idempotency

Use `doc.getIn(path)` to check whether the desired value or structure is already present before applying changes:

```ts
const existingStep = steps.items.find((step) => step?.get('name')?.toString().toLowerCase().includes('find module.ts'));
if (existingStep) {
  return context; // already migrated
}
```
