---
id: angular-react-convert-from-kbn
title: Migrate from kbn package
sidebar_position: 1
description: How to migrate a plugin that uses the kbn package to current methods.
keywords:
  - grafana
  - plugins
  - plugin
  - React
  - ReactJS
  - Angular
  - migration
  - kbn
---

# Angular to React: Convert from kbn

The kbn package is often used to provide formatted output from data sources in Angular-based Grafana plugins. However, you may need to migrate from kbn package because it is no longer available from the Grafana core.

Specifically your plugin may use these kbn API calls:

```ts
getUnitFormats();
valueFormats();
roundValue();
```

## Conversion to new methods

### Convert from `getUnitFormats`

For plugins that make use of `kbn.getUnitFormats()`, the new method to use comes from `@grafana/data`, called `getValueFormats()`.

This method returns an object with categorized unit formats instead of a flat list of units, and should be handled accordingly.

Generally, a configuration editor can just use the default unit format provider. However, if you need to have a unit picker, you can use the `UnitPicker` component from `@grafana/ui`.
An example of this component is the [Grafana design system unit picker](https://developers.grafana.com/ui/latest/index.html?path=/story/pickers-and-editors-unitpicker--basic).

### Convert from `valueFormats`

In Angular plugins, a common pattern is to use kbn to get a format function for a specific unit, then call the function with a few parameters, as shown below:

```ts
const formatFunc = kbn.valueFormats[this.panel.format];
data.valueFormatted = formatFunc(data.value, decimalInfo.decimals, decimalInfo.scaledDecimals);
```

There are several methods for formatting a value to include the unit for text output, each addressing different scenarios.

Iterate the fields of the frame to get all value fields, then process each of them, as shown in the following example. This is a basic example; typically, more code is required to include `valueMappings` and other overrides.

```ts
import { formattedValueToString, getFieldDisplayName, getValueFormat, reduceField } from '@grafana/data';

const valueFields: Field[] = [];
for (const aField of frame.fields) {
  if (aField.type === FieldType.number) {
    valueFields.push(aField);
  }
}
for (const valueField of valueFields) {
  const standardCalcs = reduceField({ field: valueField!, reducers: ['bogus'] });
  const result = getValueFormat(valueField!.config.unit)(operatorValue, maxDecimals, undefined, undefined);
  const valueFormatted = formattedValueToString(result);
}
```

There are many examples of processing frames into formatted text output throughout the panels that come with Grafana. Search for these functions in the [GitHub repo](https://github.com/grafana/grafana) to find examples such as these:

- `formattedValueToString`
- `getValueFormat`
- `reduceField`

### Convert from `roundValue`

Your plugin may include code like this:

```ts
data.valueRounded = kbn.roundValue(data.value, decimalInfo.decimals);
```

Convert this code like so:

```ts
import { roundDecimals } from '@grafana/data';
const valueRounded = roundDecimals(data.value, decimalInfo.decimals);
```

## Additional resources

Formatting values for the displayed string including units may include a prefix, suffix, and other custom settings like the color of the text itself.

Many customizations are possible when implementing the new methods. Here are some examples that you can reference:

- [BarChart](https://github.com/grafana/grafana/blob/dc6cd4bb296dda4312395aaee0ee491d348f84bc/public/app/plugins/panel/barchart/distribute.ts#L7)
- [GeoMap](https://github.com/grafana/grafana/blob/dc6cd4bb296dda4312395aaee0ee491d348f84bc/public/app/plugins/panel/geomap/utils/measure.ts#L36)
- [PieChart](https://github.com/grafana/grafana/blob/dc6cd4bb296dda4312395aaee0ee491d348f84bc/public/app/plugins/panel/piechart/PieChartPanel.tsx#L118)
- [Polystat](https://github.com/grafana/grafana-polystat-panel/blob/ecc71d54c3e8819e66604f26aa31d72fb0432873/src/data/processor.ts#L278)
