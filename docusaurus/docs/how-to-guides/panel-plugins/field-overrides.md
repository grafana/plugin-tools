---
id: field-overrides
title: Add field override support to panel plugins
description: How to enable and customize field overrides in your panel plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - panel
  - field overrides
  - field config
  - useFieldConfig
  - custom field config
---

# Add field override support to panel plugins

Field overrides let dashboard users customize how individual fields are displayed in a panel. For example, a user might change the unit of a single series, apply a different color to one field, or set custom thresholds for a specific column in a table.

This guide shows you how to enable field overrides in your panel plugin, customize which standard options are available, and define your own custom field configuration properties.

## Prerequisites

- A Grafana panel plugin with a `module.ts` entry point
- Familiarity with TypeScript and the `PanelPlugin` API

:::tip

For a step-by-step guide to building a panel plugin from scratch, refer to the [panel plugin tutorial](../../tutorials/build-a-panel-plugin.md).

:::

## How field overrides work

Grafana's field configuration system has two layers:

1. **Defaults** apply to every field in the panel. Users set these in the panel editor options pane, where standard properties appear under sections such as **Standard options**, **Thresholds**, **Value mappings**, and **Data links and actions**, and custom properties appear under the categories your plugin defines.
2. **Overrides** apply only to fields that match a specific rule. Users add these with the **Add field override** button at the bottom of the panel editor options pane. Each rule has a _matcher_ (which fields to target) and one or more _properties_ (what to change).

Grafana applies defaults first, then applies matching override rules on top in order. Later rules take precedence over earlier ones.

Users can match fields by exact name, by regular expression, by field type, by the query that returned them, or by field values (for example, all fields whose values are null).

## Enable field configuration

Call `useFieldConfig()` on your `PanelPlugin` instance in `module.ts` to enable all standard field configuration properties (unit, decimals, thresholds, color, value mappings, data links, and others). This makes them available in the panel editor both as defaults and as overrides.

```ts title="src/module.ts"
import { PanelPlugin } from '@grafana/data';
import { SimplePanel } from './SimplePanel';
import { Options } from './types';

export const plugin = new PanelPlugin<Options>(SimplePanel).useFieldConfig();
```

With this single call, users of your panel can set default values for all standard properties and add override rules that target specific fields.

## Customize standard options

Pass a configuration object to `useFieldConfig()` to customize which standard properties are available and what their defaults are.

### Set default values

Use `standardOptions` to change the default value of any standard property:

```ts title="src/module.ts"
import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { SimplePanel } from './SimplePanel';
import { Options } from './types';

export const plugin = new PanelPlugin<Options>(SimplePanel).useFieldConfig({
  standardOptions: {
    [FieldConfigProperty.Decimals]: {
      defaultValue: 2,
    },
    [FieldConfigProperty.Unit]: {
      defaultValue: 'percent',
    },
  },
});
```

### Disable standard options

If certain properties don't make sense for your visualization, remove them with `disableStandardOptions`. This hides the property from both the defaults panel and the override property picker:

```ts title="src/module.ts"
import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { SimplePanel } from './SimplePanel';
import { Options } from './types';

export const plugin = new PanelPlugin<Options>(SimplePanel).useFieldConfig({
  disableStandardOptions: [FieldConfigProperty.Thresholds, FieldConfigProperty.Mappings],
});
```

### Configure standard option settings

Some standard options accept additional settings that control their behavior. For example, the color option supports different color modes:

```ts title="src/module.ts"
import { FieldColorModeId, FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { SimplePanel } from './SimplePanel';
import { Options } from './types';

export const plugin = new PanelPlugin<Options>(SimplePanel).useFieldConfig({
  standardOptions: {
    [FieldConfigProperty.Color]: {
      settings: {
        byValueSupport: true,
        bySeriesSupport: true,
        preferThresholdsMode: false,
      },
      defaultValue: {
        mode: FieldColorModeId.PaletteClassic,
      },
    },
  },
});
```

Each `standardOptions` entry also accepts `hideFromDefaults: true`, which hides the property from the defaults section of the options pane while keeping it available in override rules.

## Add custom field configuration properties

You can define custom properties specific to your visualization beyond the standard ones. These appear alongside the standard options in the panel editor and are available as override properties.

### Define the custom field config type

Start by defining a TypeScript interface for your custom field configuration:

```ts title="src/types.ts"
export interface FieldConfig {
  lineWidth: number;
  fillOpacity: number;
  showPoints: boolean;
}

export const defaultFieldConfig: FieldConfig = {
  lineWidth: 1,
  fillOpacity: 10,
  showPoints: false,
};
```

### Register custom properties

Pass your custom field config type as the second generic parameter to `PanelPlugin` and use the `useCustomConfig` callback to register each property with the builder:

```ts title="src/module.ts"
import { PanelPlugin } from '@grafana/data';
import { SimplePanel } from './SimplePanel';
import { FieldConfig, Options, defaultFieldConfig } from './types';

export const plugin = new PanelPlugin<Options, FieldConfig>(SimplePanel).useFieldConfig({
  useCustomConfig: (builder) => {
    builder
      .addSliderInput({
        path: 'lineWidth',
        name: 'Line width',
        description: 'Width of the line in pixels',
        defaultValue: defaultFieldConfig.lineWidth,
        settings: {
          min: 0,
          max: 10,
          step: 1,
        },
      })
      .addSliderInput({
        path: 'fillOpacity',
        name: 'Fill opacity',
        description: 'Opacity of the area fill below the line',
        defaultValue: defaultFieldConfig.fillOpacity,
        settings: {
          min: 0,
          max: 100,
          step: 1,
        },
      })
      .addBooleanSwitch({
        path: 'showPoints',
        name: 'Show points',
        description: 'Whether to show data points on the line',
        defaultValue: defaultFieldConfig.showPoints,
      });
  },
});
```

The builder provides the following methods. All return the builder instance, so you can chain calls:

| Method               | Value type | Use case                            |
| -------------------- | ---------- | ----------------------------------- |
| `addNumberInput`     | `number`   | Free-form number input              |
| `addSliderInput`     | `number`   | Number input with a slider          |
| `addTextInput`       | `string`   | Free-form text input                |
| `addBooleanSwitch`   | `boolean`  | Toggle switch                       |
| `addSelect`          | `T`        | Dropdown select                     |
| `addRadio`           | `T`        | Radio button group                  |
| `addColorPicker`     | `string`   | Color picker                        |
| `addUnitPicker`      | `string`   | Unit picker dropdown                |
| `addFieldNamePicker` | `string`   | Field name picker                   |
| `addCustomEditor`    | `T`        | Fully custom React editor component |

:::note

If none of the built-in editors fit your needs, you can build a fully custom editor component using `addCustomEditor`. For more information on building custom editors, refer to [Build a custom panel option editor](./custom-panel-option-editors.md).

When using `addCustomEditor` for a field config property, you must also provide an `override` component (used in the overrides UI) and a `process` function. For most cases, use `identityOverrideProcessor` from `@grafana/data`, which passes the value through unchanged:

```ts
import { identityOverrideProcessor } from '@grafana/data';
import { MyCustomEditor } from './MyCustomEditor';

builder.addCustomEditor({
  id: 'myProperty',
  path: 'myProperty',
  name: 'My property',
  defaultValue: { mode: 'default' },
  editor: MyCustomEditor,
  override: MyCustomEditor,
  process: identityOverrideProcessor,
  shouldApply: () => true,
});
```

:::

### Control property visibility

Each property config object accepts several optional fields that control when and where the property appears:

- **`category`**: Groups related properties into a collapsible section in the panel editor. The first array element becomes the section heading.
- **`showIf`**: Shows the property only when a condition is met. Receives the current field config and returns a boolean.
- **`shouldApply`**: Controls whether the property's default value is applied to a given field. Receives the field and returns a boolean. Use it to keep defaults from being applied to fields where they don't make sense, for example numeric styling on string fields. Values set through override rules are applied regardless of `shouldApply`.
- **`hideFromDefaults`**: Hides the property from the defaults tab. It remains available in overrides.
- **`hideFromOverrides`**: Hides the property from the overrides tab. It remains available in defaults.

The following example demonstrates `category`, `showIf`, and `shouldApply` together:

```ts title="src/module.ts"
import { FieldType, PanelPlugin } from '@grafana/data';
import { SimplePanel } from './SimplePanel';
import { FieldConfig, Options } from './types';

export const plugin = new PanelPlugin<Options, FieldConfig>(SimplePanel).useFieldConfig({
  useCustomConfig: (builder) => {
    builder
      .addRadio({
        path: 'drawStyle',
        name: 'Style',
        category: ['Graph styles'],
        defaultValue: 'line',
        settings: {
          options: [
            { value: 'line', label: 'Line' },
            { value: 'bars', label: 'Bars' },
            { value: 'points', label: 'Points' },
          ],
        },
        // Only apply the default value to numeric fields
        shouldApply: (field) => field.type === FieldType.number,
      })
      .addSliderInput({
        path: 'lineWidth',
        name: 'Line width',
        category: ['Graph styles'],
        defaultValue: 1,
        settings: { min: 0, max: 10, step: 1 },
        // Only visible when draw style is "line"
        showIf: (config) => config.drawStyle === 'line',
      });
  },
});
```

## Access field configuration in your panel component

Grafana applies both defaults and overrides to each field before passing data to your panel. The resolved configuration is available on each field through `field.config`, with custom properties under `field.config.custom`:

```tsx title="src/SimplePanel.tsx"
import React from 'react';
import { FieldType, PanelProps } from '@grafana/data';
import { Options, FieldConfig } from './types';

export const SimplePanel = ({ data, width, height }: PanelProps<Options>) => {
  const frame = data.series[0];

  return (
    <div style={{ width, height }}>
      {frame.fields
        .filter((field) => field.type === FieldType.number)
        .map((field, i) => {
          // Standard field config
          const unit = field.config.unit;
          const decimals = field.config.decimals;

          // Custom field config
          const custom = (field.config.custom ?? {}) as FieldConfig;
          const lineWidth = custom.lineWidth ?? 1;

          return (
            <span key={i}>
              {field.display!(field.values[0]).text} ({unit}, {decimals} decimals, {lineWidth}px line)
            </span>
          );
        })}
    </div>
  );
};
```

## Complete example

Here is a complete `module.ts` that combines standard option customization, disabled options, and custom field configuration properties:

```ts title="src/types.ts"
export interface Options {
  showLegend: boolean;
}

export interface FieldConfig {
  lineWidth: number;
  fillOpacity: number;
  drawStyle: 'line' | 'bars' | 'points';
}

export const defaultFieldConfig: FieldConfig = {
  lineWidth: 1,
  fillOpacity: 10,
  drawStyle: 'line',
};
```

```ts title="src/module.ts"
import { FieldColorModeId, FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { SimplePanel } from './SimplePanel';
import { FieldConfig, Options, defaultFieldConfig } from './types';

export const plugin = new PanelPlugin<Options, FieldConfig>(SimplePanel)
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Color]: {
        settings: {
          byValueSupport: true,
          bySeriesSupport: true,
          preferThresholdsMode: false,
        },
        defaultValue: {
          mode: FieldColorModeId.PaletteClassic,
        },
      },
      [FieldConfigProperty.Unit]: {
        defaultValue: 'short',
      },
    },
    disableStandardOptions: [FieldConfigProperty.Mappings],
    useCustomConfig: (builder) => {
      builder
        .addRadio({
          path: 'drawStyle',
          name: 'Style',
          category: ['Graph styles'],
          defaultValue: defaultFieldConfig.drawStyle,
          settings: {
            options: [
              { value: 'line', label: 'Line' },
              { value: 'bars', label: 'Bars' },
              { value: 'points', label: 'Points' },
            ],
          },
        })
        .addSliderInput({
          path: 'lineWidth',
          name: 'Line width',
          category: ['Graph styles'],
          defaultValue: defaultFieldConfig.lineWidth,
          settings: {
            min: 0,
            max: 10,
            step: 1,
          },
          showIf: (config) => config.drawStyle === 'line',
        })
        .addSliderInput({
          path: 'fillOpacity',
          name: 'Fill opacity',
          category: ['Graph styles'],
          defaultValue: defaultFieldConfig.fillOpacity,
          settings: {
            min: 0,
            max: 100,
            step: 1,
          },
        });
    },
  })
  .setPanelOptions((builder) => {
    builder.addBooleanSwitch({
      path: 'showLegend',
      name: 'Show legend',
      defaultValue: true,
    });
  });
```

With this setup, dashboard users can set a default draw style, line width, and fill opacity for all fields, and add override rules to change any of these properties for specific fields. For example, they could render one series as bars while keeping the rest as lines.
