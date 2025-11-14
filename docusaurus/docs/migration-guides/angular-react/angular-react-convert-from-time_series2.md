---
id: angular-react-convert-from-time_series2
title: Migrate from time_series2 package
sidebar_position: 6
description: How to migrate a plugin that uses the app/core/time_series2 package to current methods.
keywords:
  - grafana
  - plugins
  - plugin
  - React
  - ReactJS
  - Angular
  - migration
  - time_series2
---

# Angular to React: Convert from app/core/time_series2

The `app/core/time_series2` package is commonly used by AngularJS plugins to retrieve data to be rendered by a panel. This package is no longer available, and all plugins need to use data frames instead.

This guide provides one method of converting from the old library to the new data frame format.

## Convert data using the AngularJS method

Before the removal of the `app/core/time_series2` package in AngularJS, data was rendered by a panel using a method similar to this:

```ts
seriesHandler(seriesData: any) {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });
    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }
```

## Convert data using data frames

The following code example shows one way of converting data from panels using data frames:

```ts
import {
  GrafanaTheme2,
  FieldDisplay,
  getDisplayProcessor,
  getFieldDisplayValues,
  FieldConfig,
  DisplayValue,
  formattedValueToString,
} from '@grafana/data';

const theme2 = useTheme2();

const getValues = (): FieldDisplay[] => {
  for (const frame of data.series) {
    for (const field of frame.fields) {
      // Set the Min/Max value automatically for percent and percentunit
      if (field.config.unit === 'percent' || field.config.unit === 'percentunit') {
        const min = field.config.min ?? 0;
        const max = field.config.max ?? (field.config.unit === 'percent' ? 100 : 1);
        field.state = field.state ?? {};
        field.state.range = { min, max, delta: max - min };
        field.display = getDisplayProcessor({ field, theme: theme2 });
      }
    }
  }
  return getFieldDisplayValues({
    fieldConfig,
    reduceOptions: {
      calcs: [options.operatorName],
      values: false,
    },
    replaceVariables,
    theme: theme2,
    data: data.series,
    timeZone,
  });
};

const getThresholdForValue = (field: FieldConfig, value: number, theme: GrafanaTheme2) => {
  if (fieldConfig.defaults.thresholds) {
    const result = getActiveThreshold(value, field.thresholds?.steps);
    return result;
  }
  return null;
};

const getFormattedValue = (index: number) => {
  const singleMetric = metrics[index];
  return formattedValueToString(singleMetric.display);
};

const getDisplayValue = (index: number) => {
  const singleMetric = metrics[index];
  if (!isNaN(singleMetric.display.numeric)) {
    return singleMetric.display.numeric;
  }
  return NaN;
};

// get the formatted metrics
const metrics = getValues();
```

## Additional resources

- Read more [Angular to React conversion guides](/migration-guides/angular-react/).
- Learn more about [data frames](../../key-concepts/data-frames).
