---
id: work-with-transformations
title: Work with data transformations in panel plugins
description: How to handle transformed data in Grafana panel plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - panel
  - transformations
  - data frames
  - dataframes
---

# Work with data transformations

[Data transformations](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data) let users reshape, filter, and aggregate query results before they reach a panel visualization. As a plugin developer, you don't need to implement transformations yourself — Grafana applies them automatically. However, transformations can change the shape of the data your plugin receives, so your plugin must handle varying data structures gracefully.

:::tip

For a step-by-step guide to making your own panel plugin, refer to our [Tutorial for panel plugins](../../tutorials/build-a-panel-plugin.md).

:::

## How the data pipeline works

When a user queries data in Grafana, the results pass through a pipeline before reaching your panel plugin:

```
Data source query → Transformations → Field overrides → Panel plugin
```

1. **Data source query**: The data source returns one or more [data frames](../../key-concepts/data-frames).
2. **Transformations**: Grafana applies any user-configured transformations sequentially, modifying the structure or content of the data frames.
3. **Field overrides**: Grafana applies field configuration (units, thresholds, colors, display names) to the transformed data.
4. **Panel plugin**: Your plugin receives the final `PanelData` object via `props.data`.

Your plugin always receives already-transformed data. You never need to apply transformations yourself.

:::note

Transformations can change the shape of the data significantly: users can filter out fields, add calculated fields, merge multiple frames into one, group rows, or reorder data. Your plugin should not assume a fixed data structure.

:::

## Validate data before using it

Since transformations can produce data in any shape, always validate the data before using it. Search for fields by type rather than by name, since transformations may rename or reorder fields:

```ts title="src/components/MyPanel.tsx"
import { FieldType, PanelProps } from '@grafana/data';

interface Props extends PanelProps<MyOptions> {}

export function MyPanel({ data }: Props) {
  const frame = data.series[0];

  if (!frame || frame.length === 0) {
    throw new Error('Query returned no data.');
  }

  const timeField = frame.fields.find((field) => field.type === FieldType.time);
  const valueField = frame.fields.find((field) => field.type === FieldType.number);

  if (!timeField || !valueField) {
    throw new Error(
      'This panel requires at least one time field and one number field. ' +
        'Check your query or transformations.'
    );
  }

  // Safe to use timeField and valueField
}
```

For a detailed guide on reading data frames, refer to [Read data frames returned by a data source plugin](./read-data-from-a-data-source). For more on error handling patterns, refer to [Error handling for panel plugins](./error-handling-for-panel-plugins).

## Let users choose which fields to use

When your visualization needs specific fields (for example, X-axis and Y-axis), let users select them from the available fields rather than assuming field names. If the user hasn't selected a field, fall back to the first field of a matching type:

```ts title="src/components/MyPanel.tsx"
export function MyPanel({ data, options }: Props) {
  const frame = data.series[0];

  const valueField = frame.fields.find((field) =>
    options.valueFieldName ? field.name === options.valueFieldName : field.type === FieldType.number
  );
}
```

This approach works well with transformations because users can reshape the data first, then select the appropriate fields in your panel options.

## Handle multiple data frames

Some transformations combine multiple frames into one, but other operations may produce multiple frames. Always consider that `data.series` may contain more than one frame:

```ts title="src/components/MyPanel.tsx"
export function MyPanel({ data, options }: Props) {
  const frames = data.series;

  if (frames.length === 0 || frames.every((frame) => frame.length === 0)) {
    throw new Error('Query returned no data.');
  }

  // Option A: Work with all frames
  for (const frame of frames) {
    // Process each frame
  }

  // Option B: Let the user select which frame to display
  const frameIndex = Math.min(options.frameIndex ?? 0, frames.length - 1);
  const frame = frames[frameIndex];
}
```

## Use utility functions from `@grafana/data`

The `@grafana/data` package provides utility functions that handle data shape variations for you. Use these functions instead of writing custom data processing logic:

- **`getFieldDisplayValues`** — Reduces data to display values with field config applied. Used by stat, gauge, and similar panels.
- **`getFieldDisplayName`** — Returns the display name for a field, accounting for overrides and labels.
- **`DataFrameView`** — Iterates data frame rows as objects instead of columnar arrays.

The following example shows how to use `getFieldDisplayValues` to render reduced values with proper formatting:

```tsx title="src/components/MyPanel.tsx"
import { getFieldDisplayValues, PanelProps, ReducerID } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';

interface Props extends PanelProps<MyOptions> {}

export function MyPanel({ data, fieldConfig, replaceVariables, timeZone }: Props) {
  const theme = useTheme2();

  const values = getFieldDisplayValues({
    data: data.series,
    fieldConfig,
    reduceOptions: { calcs: [ReducerID.last], values: false },
    replaceVariables,
    theme,
    timeZone,
  });

  return (
    <div>
      {values.map((v, i) => (
        <span key={i} style={{ color: v.display.color }}>
          {v.display.title}: {v.display.text} {v.display.suffix}
        </span>
      ))}
    </div>
  );
}
```

These functions handle field overrides, display names, and threshold colors automatically — so you don't need to process field configuration yourself.
