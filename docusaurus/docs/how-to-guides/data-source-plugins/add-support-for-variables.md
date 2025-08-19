---
id: add-support-for-variables
title: Add support for variables
description: Add support for variables in Grafana plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - queries
  - variables
---

# Add support for variables

Variables are placeholders for values, and you can use them to create templated queries, and dashboard or panel links. For more information on variables, refer to [Templates and variables](https://grafana.com/docs/grafana/latest/dashboards/variables).

In this guide, you'll see how you can turn a query string like this:

```sql
SELECT * FROM services WHERE id = "$service"
```

into

```sql
SELECT * FROM services WHERE id = "auth-api"
```

Grafana provides a couple of helper functions to interpolate variables in a string template. Let's see how you can use them in your plugin.

## Add variables to plugins

### Interpolate variables in panel plugins

For panels, the `replaceVariables` function is available in the `PanelProps`.

Add `replaceVariables` to the argument list, and pass a user-defined template string to it:

```tsx
export function SimplePanel({ options, data, width, height, replaceVariables }: Props) {
  const query = replaceVariables('Now displaying $service');

  return <div>{query}</div>;
}
```

### Interpolate variables in data source plugins

For data sources, you need to use the `getTemplateSrv`, which returns an instance of `TemplateSrv`.

1. Import `getTemplateSrv` from the `runtime` package:

   ```ts
   import { getTemplateSrv } from '@grafana/runtime';
   ```

1. In your `query` method, call the `replace` method with a user-defined template string:

   ```ts
   async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
     const query = getTemplateSrv().replace('SELECT * FROM services WHERE id = "$service"', options.scopedVars);

     const data = makeDbQuery(query);

     return { data };
   }
   ```

### Set a variable from your plugin

Not only can you read the value of a variable, you can also update the variable from your plugin. Use `locationService.partial(query, replace)`.

The following example shows how to update a variable called `service`.

- `query` contains the query parameters you want to update. The query parameters that control variables are prefixed with `var-`.
- `replace: true` tells Grafana to update the current URL state rather than creating a new history entry.

```ts
import { locationService } from '@grafana/runtime';
```

```ts
locationService.partial({ 'var-service': 'billing' }, true);
```

:::caution

Grafana queries your data source whenever you update a variable. Excessive updates to variables can slow down Grafana and lead to a poor user experience.

:::

### Add support for query variables to your data source

A [query variable](https://grafana.com/docs/grafana/latest/dashboards/variables/add-template-variables#add-a-query-variable) is a type of variable that allows you to query a data source for the values. By adding support for query variables to your data source plugin, users can create dynamic dashboards based on data from your data source.

Let's start by defining a query model for the variable query:

```ts
export interface MyVariableQuery {
  namespace: string;
  rawQuery: string;
}
```

For a data source to support query variables, override the `metricFindQuery` in your `DataSourceApi` class. The `metricFindQuery` function returns an array of `MetricFindValue` which has a single property, `text`:

```ts
async metricFindQuery(query: MyVariableQuery, options?: any) {
  // Retrieve DataQueryResponse based on query.
  const response = await this.fetchMetricNames(query.namespace, query.rawQuery);

  // Convert query results to a MetricFindValue[]
  const values = response.data.map(frame => ({ text: frame.name }));

  return values;
}
```

:::note

By default, Grafana provides a basic query model and editor for simple text queries. If that's all you need, then leave the query type as `string`:

:::

```ts
async metricFindQuery(query: string, options?: any)
```

Let's create a custom query editor to allow the user to edit the query model.

1. Create a `VariableQueryEditor` component:

   ```tsx title="src/VariableQueryEditor.tsx"
   import React, { useState } from 'react';
   import { MyVariableQuery } from './types';

   interface VariableQueryProps {
     query: MyVariableQuery;
     onChange: (query: MyVariableQuery, definition: string) => void;
   }

   export const VariableQueryEditor = ({ onChange, query }: VariableQueryProps) => {
     const [state, setState] = useState(query);

     const saveQuery = () => {
       onChange(state, `${state.query} (${state.namespace})`);
     };

     const handleChange = (event: React.FormEvent<HTMLInputElement>) =>
       setState({
         ...state,
         [event.currentTarget.name]: event.currentTarget.value,
       });

     return (
       <>
         <div className="gf-form">
           <span className="gf-form-label width-10">Namespace</span>
           <input
             name="namespace"
             className="gf-form-input"
             onBlur={saveQuery}
             onChange={handleChange}
             value={state.namespace}
           />
         </div>
         <div className="gf-form">
           <span className="gf-form-label width-10">Query</span>
           <input
             name="rawQuery"
             className="gf-form-input"
             onBlur={saveQuery}
             onChange={handleChange}
             value={state.rawQuery}
           />
         </div>
       </>
     );
   };
   ```

   Grafana saves the query model whenever one of the text fields loses focus (`onBlur`), and then it previews the values returned by `metricFindQuery`.

   The second argument to `onChange` allows you to set a text representation of the query that will appear next to the name of the variable in the variables list.

2. Configure your plugin to use the query editor:

   ```ts
   import { VariableQueryEditor } from './VariableQueryEditor';

   export const plugin = new DataSourcePlugin<DataSource, MyQuery, MyDataSourceOptions>(DataSource)
     .setQueryEditor(QueryEditor)
     .setVariableQueryEditor(VariableQueryEditor);
   ```

That's it! You can now try out the plugin by adding a [query variable](https://grafana.com/docs/grafana/latest/dashboards/variables/add-template-variables#add-a-query-variable) to your dashboard.

## Using template variables

[Template variables](https://grafana.com/docs/grafana/latest/dashboards/variables/#templates) enable users to create dashboards that change dynamically based on their input. Since variables have been around in Grafana for a long time, many users expect them to be supported for any data sources they install.

### Interpolate template variables

To interpolate template variables, you need to import the `getTemplateSrv()` function from the `@grafana/runtime` package:

```ts
import { getTemplateSrv } from '@grafana/runtime';
```

The `getTemplateSrv()` function returns an instance of `TemplateSrv` which provides methods for working with template variables. The most important one, `replace()`, accepts a string containing variables as input and returns an interpolated string, where the variables have been replaced with the values that the users have selected.

For example, if you have a variable called `instance`, the following code replaces the variable with its corresponding value:

```ts
getTemplateSrv().replace("I'd like $instance, please!");

// I'd like server-1, please!
```

The `replace()` even handles built-in variables such as `$__from` and `$__to`.

And that’s it! For most use cases, that’s all you need to do to add support for template variables in your data source. Note that it’s up to you to decide which fields will support template variables. For example, to interpolate a single property, `rawQuery`, in your query, add the following:

```
const interpolatedQuery: MyQuery = {
  ...query,
  rawQuery: getTemplateSrv().replace(query.rawQuery),
};
```

### Format multi-value variables

In the previous example, the variables only had one value, `server-1`. However, if the user instead creates a multi-value variable, it can hold multiple values at the same time. Multi-value variables pose a new challenge: How do you decide how to format a collection of values?

For example, which of these different formats would suit your use case?

```ts
{server-1, server-2, server-3} (Graphite)
["server-1", "server-2", "server-3"] (JSON)
("server-1" OR "server-2" OR "server-3") (Lucene)
```

Fortunately, the `replace()` method lets you pass a third argument to allow you to choose from a set of predefined formats, such as the CSV format:

```ts
getTemplateSrv().replace("I'd like $instance, please!", {}, 'csv');

// I'd like server-1, server-2, server-3, please!
```

:::note

The second argument to the `replace()` method lets you configure sets of custom variables, or scoped variables, to include when interpolating the string. Unless this interests you, feel free to pass an empty object, `{}`.

:::

Grafana supports a range of format options. To browse the available formats, check out [Advanced variable format options](https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/#advanced-variable-format-options).

### Format variables using interpolation functions

After reviewing the advanced variable format options, you may find that you want to support a format option that isn't available. Fortunately, Grafana gives you full control over how `replace()` formats variables through the use of interpolation functions.

You can pass an interpolation function to `replace()` instead of a string as the third argument. The following example uses a custom formatter function to add an `and` before the last element:

```ts
const formatter = (value: string | string[]): string => {
  if (typeof value == 'string') {
    return value;
  }

  // Add 'and' before the last element.
  if (value.length > 1) {
    return value.slice(0, -1).join(', ') + ' and ' + value[value.length - 1];
  }

  return value[0];
};

getTemplateSrv().replace("I'd like $instance, please!", {}, formatter);

// I'd like server-1, server-2, and server-3, please!
```

The argument to the function can be a string or an array of strings such as `(string | string[])` depending on whether the variable supports multiple values, so make sure to check the type of the value before you use it.

## Using variables outside of templates

There may be a case where you want to use a variable outside of a template. For example, if you want to validate the number of selected values or add them to a drop-down menu.

This helper function uses the `replace()` method to return the values as an array:

```ts
function getValuesForVariable(name: string): string[] {
  const values: string[] = [];

  // Collects the values in an array.
  getTemplateSrv().replace(`$${name}`, {}, (value: string | string[]) => {
    if (Array.isArray(value)) {
      values.push(...value);
    } else {
      values.push(value);
    }

    // We don't really care about the string here.
    return '';
  });

  return values;
}
const instances = getValuesForVariable('instance');

for (var instance of instances) {
  console.log(instance);
}

// server-1
// server-2
// server-3
```

You can even go a step further and create an object that neatly contains all variables and their values:

```ts
function getAllVariables(): Record<string, string[]> {
  const entries = getTemplateSrv()
    .getVariables()
    .map((v) => [v.name, getValuesForVariable(v.name)]);

  return Object.fromEntries(entries);
}
const vars = getAllVariables();

console.log(vars.instance);

// ["server-1", "server-2", "server-3"]
```

In this example, use `getTemplateSrv().getVariables()` to list all configured variables for the current dashboard.

:::note

You can also split the interpolated string based on a predictable delimiter. Feel free to adapt these snippets based on what makes sense to you.

:::
