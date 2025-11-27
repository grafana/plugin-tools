# Add Support for Template & Query Variables

Variables are placeholders you can use to create templated queries and dynamic dashboards. In a data source, this means:

- Using template variables inside query fields
- Implementing `metricFindQuery` and a `VariableQueryEditor` so the data source can be used as a **Query** type variable.

Always complete **all three sections**:

1. Interpolate template variables in queries
2. Support query variables via `metricFindQuery`
3. Add a `VariableQueryEditor`

## 1. Interpolate Template Variables in Queries

File: `src/datasource.ts` (or your data source class file)

### 1.1 Import `getTemplateSrv`

```ts
import { getTemplateSrv } from '@grafana/runtime';
```

- `getTemplateSrv()` returns `TemplateSrv`, which exposes `replace()` for variable interpolation.

### 1.2 Decide which fields support variables

In your query model (e.g. `MyQuery`), identify all string fields that should accept `$var`:

```ts
export interface MyQuery {
  // existing…
  rawQuery?: string; // e.g. SQL / text query
  namespace?: string; // optional selector
  // other fields…
}
```

Rules:

- Only enable variables where they actually make sense (query strings, selectors, filters).
- Document which fields support variables if you have query editor help.

### 1.3 Apply `replace()` in `query()`

Inside your `DataSource` implementation:

```ts
import { DataQueryRequest, DataQueryResponse } from '@grafana/schema';

export class DataSource extends DataSourceApi<MyQuery> {
  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const targets = options.targets.filter((t) => !t.hide);

    const interpolatedTargets = targets.map((target) => {
      const rawQuery = getTemplateSrv().replace(
        target.rawQuery ?? '',
        options.scopedVars // include scoped vars for panel/time range
      );

      const namespace = getTemplateSrv().replace(target.namespace ?? '', options.scopedVars);

      return {
        ...target,
        rawQuery,
        namespace,
      };
    });

    // Use interpolatedTargets when building your backend request.
    return this.doRequest(interpolatedTargets, options);
  }

  private async doRequest(targets: MyQuery[], options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    // existing implementation…
  }
}
```

- `replace(template, scopedVars?)` replaces `$var` with current values and supports built-ins like `$__from` / `$__to`.
- You can keep interpolation localized to **only** the fields that support variables (e.g. `rawQuery`, `namespace`).

### 1.4 Handle multi-value variables (optional)

For multi-value variables, choose a format that matches your backend (CSV, JSON array, etc.):

```ts
const csvQuery = getTemplateSrv().replace(
  target.rawQuery ?? '',
  options.scopedVars,
  'csv' // built-in format option
);
```

Or provide a custom formatter:

```ts
const formatter = (value: string | string[]): string => {
  if (typeof value === 'string') {
    return value;
  }

  // Example: join with OR
  if (value.length > 1) {
    return '(' + value.map((v) => `"${v}"`).join(' OR ') + ')';
  }

  return value[0];
};

const formattedQuery = getTemplateSrv().replace(target.rawQuery ?? '', options.scopedVars, formatter);
```

Rules:

- Use a built-in format (`csv`, etc.) where possible.
- Use a custom interpolation function only if built-ins don’t match your protocol.

## 2. Implement `metricFindQuery` for Query Variables

File: `src/datasource.ts`

A **query variable** lets Grafana call your data source to get variable values. To support this, you override `metricFindQuery` in your `DataSourceApi` implementation.

### 2.1 Define a variable query model

File: `src/types.ts`

```ts
export interface MyVariableQuery {
  namespace: string;
  rawQuery: string;
}
```

- Keep this model minimal – only the fields needed to fetch variable values.
- This is separate from your “regular” `MyQuery` if that simplifies things.

> If a plain text query is enough, you can leave `query` as `string` and skip the model entirely:
> `async metricFindQuery(query: string, options?: any)`

### 2.2 Implement `metricFindQuery`

File: `src/datasource.ts`

```ts
import { MetricFindValue } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { MyVariableQuery } from './types';

export class DataSource extends DataSourceApi<MyQuery> {
  // existing query()…

  async metricFindQuery(variableQuery: MyVariableQuery | string, options?: any): Promise<MetricFindValue[]> {
    if (typeof variableQuery === 'string') {
      const interpolated = getTemplateSrv().replace(variableQuery);
      const response = await this.fetchVariableValues({ rawQuery: interpolated });
      return response.map((name) => ({ text: name }));
    }

    // If using MyVariableQuery model:
    const namespace = getTemplateSrv().replace(variableQuery.namespace);
    const rawQuery = getTemplateSrv().replace(variableQuery.rawQuery);

    const response = await this.fetchMetricNames(namespace, rawQuery);

    // Adapt this to match your backend response
    return response.data.map((item: any) => ({
      text: item.name,
      // optional: value: item.id,
    }));
  }

  private async fetchMetricNames(namespace: string, rawQuery: string) {
    // call backend/API and return data in a consistent shape
  }

  private async fetchVariableValues(args: { rawQuery: string }) {
    // simplified variant if using a simple string-based query
  }
}
```

Rules:

- Return an array of `{ text: string }` (`MetricFindValue[]`).
- Use `getTemplateSrv().replace` inside `metricFindQuery` so variable queries can themselves use other variables (e.g. cascading variables).
- Keep queries lightweight – `metricFindQuery` can be called often by Grafana.

## 3. Add a `VariableQueryEditor`

If you use a structured `MyVariableQuery` model, add a small React editor so users can configure it from the variable UI.

### 3.1 Create `VariableQueryEditor`

File: `src/VariableQueryEditor.tsx`

```tsx
import React, { useState } from 'react';
import { MyVariableQuery } from './types';

interface VariableQueryProps {
  query: MyVariableQuery;
  onChange: (query: MyVariableQuery, definition: string) => void;
}

export const VariableQueryEditor = ({ query, onChange }: VariableQueryProps) => {
  const [state, setState] = useState<MyVariableQuery>(query);

  const saveQuery = () => {
    // Second argument is the human-readable label shown in the variable list
    const definition = `${state.rawQuery} (${state.namespace})`;
    onChange(state, definition);
  };

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;

    const next = {
      ...state,
      [name]: value,
    };

    setState(next);
  };

  return (
    <>
      <div className="gf-form">
        <span className="gf-form-label width-10">Namespace</span>
        <input
          name="namespace"
          className="gf-form-input"
          value={state.namespace}
          onChange={handleChange}
          onBlur={saveQuery}
        />
      </div>

      <div className="gf-form">
        <span className="gf-form-label width-10">Query</span>
        <input
          name="rawQuery"
          className="gf-form-input"
          value={state.rawQuery}
          onChange={handleChange}
          onBlur={saveQuery}
        />
      </div>
    </>
  );
};
```

### 3.2 Register `VariableQueryEditor` in the plugin

File: `src/module.ts`

```ts
import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { QueryEditor } from './QueryEditor';
import { VariableQueryEditor } from './VariableQueryEditor';
import { MyQuery, MyDataSourceOptions, MyVariableQuery } from './types';

export const plugin = new DataSourcePlugin<DataSource, MyQuery, MyDataSourceOptions>(DataSource)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableQueryEditor);
```

- `setVariableQueryEditor` wires your editor into Grafana’s variable UI.
