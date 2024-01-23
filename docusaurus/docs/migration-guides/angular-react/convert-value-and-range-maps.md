---
id: angular-react-convert-value-and-range-maps
title: Convert from AngularJS Value and Range Maps to React
sidebar_position: 5
description: How to migrate a plugin that uses value and range maps.
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

# Converting AngularJS Value and Range Maps to React

The AngularJS sdk provided editors for Value and Range Maps that will have to be migrated from the old format to the new format.

## Adding new builtin editors

In your `module.ts` file, add the Mappings option to enable the new editor:

```ts
.useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Mappings]: {},
    },
  })
```

See [Value Mappings](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-value-mappings/) for the new components provided by this option.

## Conversion to new format

A helper function is provided below to perform the conversion. It's important to clean up the old configuration so the migration does not repeat.

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

An example of this migration can be found [here](https://github.com/grafana/grafana-polystat-panel/blob/main/src/migrations.ts#L131).
