---
id: add-value-mappings-support
title: Add value mappings support to panel plugins
description: How to add value mappings support to panel plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - panel
  - value mappings
  - field config
---

# Add value mappings support to a panel plugin

Value mappings let users replace raw field values with human-readable text, colors, and icons. For example, a numeric status code `0` can display as "Offline" in red, while `1` displays as "Online" in green.

Value mappings are a standard field configuration option in Grafana. When you enable them for your panel plugin, Grafana handles all of the configuration UI and value processing automatically. Your panel only needs to read the already-mapped display values from each field.

For more information on how value mappings work for end users, refer to [Configure value mappings](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-value-mappings/).

## Enable value mappings

Value mappings are part of the standard field configuration system. To enable them, call `.useFieldConfig()` on your `PanelPlugin` in `module.ts`:

```ts title="src/module.ts"
import { PanelPlugin } from '@grafana/data';
import { MyPanel } from './components/MyPanel';
import { type Options } from './types';

export const plugin = new PanelPlugin<Options>(MyPanel).useFieldConfig();
```

Calling `useFieldConfig()` without arguments enables all standard field configuration options, including value mappings, thresholds, units, min/max, and color.

### Enable a specific standard option

If your panel only needs specific standard options, you can selectively enable or disable them using the `standardOptions` or `disableStandardOptions` parameters:

```ts title="src/module.ts"
import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { MyPanel } from './components/MyPanel';
import { type Options } from './types';

// Enable only value mappings and unit
export const plugin = new PanelPlugin<Options>(MyPanel).useFieldConfig({
  standardOptions: {
    [FieldConfigProperty.Mappings]: {},
    [FieldConfigProperty.Unit]: {},
  },
});
```

## Use mapped values in your panel

Once you've enabled field configuration with `useFieldConfig()`, Grafana automatically applies value mappings to each field's values. Your panel reads the mapped results through the field's `display` function, which returns a `DisplayValue` object with the resolved `text`, `color`, and `icon`.

For more background on reading display values from data frames, refer to [Display values from a data frame](./read-data-from-a-data-source.md#display-values-from-a-data-frame).

```tsx title="src/components/MyPanel.tsx"
import React from 'react';
import { FieldType, formattedValueToString, type PanelProps } from '@grafana/data';
import { type Options } from '../types';

interface Props extends PanelProps<Options> {}

export function MyPanel({ data, width, height }: Props) {
  const frame = data.series[0];
  if (!frame) {
    return <div>No data</div>;
  }

  const valueField = frame.fields.find((field) => field.type === FieldType.number);

  return (
    <div style={{ width, height }}>
      {valueField?.values.map((value, index) => {
        const displayValue = valueField.display!(value);

        return (
          <span key={index} style={{ color: displayValue.color }}>
            {formattedValueToString(displayValue)}
          </span>
        );
      })}
    </div>
  );
}
```

When you configure a value mapping (for example, mapping `0` to "Offline"), the `display` function returns the mapped text instead of the raw number. If no mapping matches, the raw value is formatted using the field's unit and decimal settings as usual.

### Use `getFieldDisplayValues` for reduced values

If your panel displays reduced values (such as the last value, mean, or sum), use `getFieldDisplayValues`. This function processes value mappings the same way and returns the results as `FieldDisplay` objects:

```tsx
const fieldDisplayValues = getFieldDisplayValues({
  fieldConfig,
  reduceOptions: options.reduceOptions,
  data: data.series,
  theme,
  replaceVariables,
  timeZone,
});

fieldDisplayValues.map((fieldDisplay) => {
  const text = formattedValueToString(fieldDisplay.display);
  const color = fieldDisplay.display.color;
  // ...
});
```

## Behind the scenes

1. **Configuration**: You're adding value mappings in the panel editor under the "Value mappings" section.
2. **Processing**: When data arrives, Grafana applies the mappings and sets up a `display` function on each field.
3. **Evaluation**: When your panel calls `field.display(value)`, Grafana evaluates the value against each mapping in order and returns the first match.
4. **Rendering**: Your panel uses the returned `DisplayValue` to render the mapped text, color, and icon.

Mappings are evaluated in the order they are defined. The first matching mapping wins. If no mapping matches, Grafana falls back to standard value formatting (units, decimals, and so on).
