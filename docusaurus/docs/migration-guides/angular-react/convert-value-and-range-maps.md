---
id: angular-react-convert-mappings
title: Convert value and range maps
sidebar_position: 3
description: How to migrate an Angular plugin that uses value and range maps to React
keywords:
  - grafana
  - plugins
  - plugin
  - React
  - ReactJS
  - Angular
  - migration
  - rangemap
  - valuemap
---

# Convert value and range maps

Grafana plugins built using the AngularJS SDK could use editors for value and range maps. When updating your plugin to React, it is necessary to convert the configuration options of these maps to a new format.

## Add new built-in editors

In your plugin's `module.ts` file, add the `Mappings` option to enable the new editor:

```ts
.useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Mappings]: {},
    },
  })
```

Refer to the [Configure value mappings](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-value-mappings/) documentation for descriptions of the new components.

## Convert mappings to new format

Use the helper function shown below to update your plugin's configurations.

```ts
import { PanelModel, convertOldAngularValueMappings, ValueMapping } from '@grafana/data';

export const PolystatPanelMigrationHandler = (panel: PanelModel<PolystatOptions>): Partial<PolystatOptions> => {
  // convert range and value maps
  const newMaps = migrateValueAndRangeMaps(panel);
  panel.options.fieldConfig = {
    defaults: {
      mappings: newMaps,
    },
    overrides: [],
  };
  //@ts-ignore
  delete panel.mappingType;
  //@ts-ignore
  delete panel.rangeMaps;
  //@ts-ignore
  delete panel.valueMaps;
  // return new settings
  return panel.options;
};

export const migrateValueAndRangeMaps = (panel: any) => {
  // value maps first
  panel.mappingType = 1;
  let newValueMappings: ValueMapping[] = [];
  if (panel.valueMaps !== undefined) {
    newValueMappings = convertOldAngularValueMappings(panel);
  }
  // range maps second
  panel.mappingType = 2;
  let newRangeMappings: ValueMapping[] = [];
  if (panel.rangeMaps !== undefined) {
    newRangeMappings = convertOldAngularValueMappings(panel);
  }
  // append together
  const newMappings = newValueMappings.concat(newRangeMappings);
  // get uniques only
  return [...new Map(newMappings.map((v) => [JSON.stringify(v), v])).values()];
};
```

:::tip

Be sure to clean up the old settings so the migration does not repeat itself.

:::

For another illustration, refer to [this example](https://github.com/grafana/grafana-polystat-panel/blob/main/src/migrations.ts#L131).
