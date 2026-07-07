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
2. **Transformations**: Grafana applies any user-configured transformations sequentially, in the order the user arranged them, modifying the structure or content of the data frames.
3. **Field overrides**: Grafana applies field configuration (units, thresholds, colors, display names) to the transformed data.
4. **Panel plugin**: Your plugin receives the final `PanelData` object via `props.data`.

Your plugin always receives already-transformed data. You never need to apply transformations yourself, and there is no way for a panel to opt out of them or access the untransformed data.

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
      'This panel requires at least one time field and one number field. Check your query or transformations.'
    );
  }

  // Safe to use timeField and valueField
}
```

For a detailed guide on reading data frames, refer to [Read data frames returned by a data source plugin](./read-data-from-a-data-source). For more on error handling patterns, refer to [Error handling for panel plugins](./error-handling-for-panel-plugins).

:::note

If a transformation itself fails — for example, a calculation referencing a field that no longer exists — Grafana sets `data.state` to `LoadingState.Error` and adds the error to `data.errors`. Grafana displays these errors in the panel's error indicator, so your plugin doesn't need to handle them.

:::

## Let users choose which fields to use

When your visualization needs specific fields (for example, X-axis and Y-axis), let users select them from the available fields rather than assuming field names, and fall back to the first field of a matching type when nothing is selected. This pattern is described in [Provide usable defaults](./error-handling-for-panel-plugins#provide-usable-defaults). It works especially well with transformations: users can reshape the data first, then select the appropriate fields in your panel options.

## Handle multiple data frames

Transformations can change the number of frames in either direction: **Merge** and **Join by field** combine multiple frames into one, while **Partition by values** splits a single frame into many. Always consider that `data.series` may contain any number of frames:

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
  const frameIndex = Math.max(0, Math.min(options.frameIndex ?? 0, frames.length - 1));
  const frame = frames[frameIndex];
}
```

## Detect structure changes with `structureRev`

If your panel performs expensive processing when the data shape changes — for example, rebuilding a chart configuration — use `data.structureRev` to tell structural changes apart from value-only updates. Grafana increments this revision counter whenever the structure of the data frames changes: fields added, removed, renamed, or retyped. Editing transformations typically changes the structure, so it also bumps the revision.

```tsx title="src/components/MyPanel.tsx"
import { useMemo } from 'react';

export function MyPanel({ data }: Props) {
  // Intentionally depend on structureRev instead of data.series: the series
  // array is a new reference on every refresh, but the chart configuration
  // only needs rebuilding when the structure changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chartConfig = useMemo(() => buildChartConfig(data.series), [data.structureRev]);
}
```

Note that `structureRev` is optional on `PanelData`; when it's undefined, fall back to reprocessing on every update.

## Use utility functions from `@grafana/data`

The `@grafana/data` package provides utility functions that handle data shape variations for you. Use these functions instead of writing custom data processing logic:

- **`getFieldDisplayValues`** — Reduces data to display values with field config applied. Used by stat, gauge, and similar panels.
- **`getFieldDisplayName`** — Returns the display name for a field, accounting for overrides and labels.
- **`DataFrameView`** — Iterates data frame rows as objects instead of columnar arrays.
- **`FieldCache`** — Indexes a frame's fields for lookup by name, type, or label.

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

## Test your panel with transformations

To make sure your panel handles reshaped data gracefully, exercise it with the transformations that change data shape the most. In the panel editor, add each of the following and confirm your panel either renders correctly or shows a helpful error message:

- **Organize fields by name** — renames, reorders, and hides fields.
- **Reduce** — collapses time series into single values, removing the time field.
- **Group by** — replaces raw rows with aggregated ones.
- **Merge series/tables** or **Join by field** — combines multiple frames into one.
- **Partition by values** — splits one frame into many.
- **Filter fields by name** — removes fields your panel might depend on.

Use the **Table view** toggle in the panel editor to inspect exactly what data your panel receives after transformations.

## Can my plugin add custom transformations?

No. The transformations available in the **Transformations** tab are built into Grafana core, and there is currently no plugin API for registering new ones. If your panel needs custom data processing, implement it inside your panel component — ideally controlled through panel options so users can configure it, and memoized with [`structureRev`](#detect-structure-changes-with-structurerev) if it's expensive.
