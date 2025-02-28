---
id: create-data-frames
title: Create data frames
description: A guide to working with data frames in plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - data frames
  - dataframes
---

The [data frame](../../key-concepts/data-frames) is a columnar data structure that allows for efficient querying of large amounts of data. Since data frames are a central concept when developing data source and other plugins for Grafana, in this guide we'll look at some ways you can use them.

The `DataFrame` interface contains a `name` and an array of `fields` where each field contains the name, type, and the values for the field.

:::note

If you want to migrate an existing plugin to use the data frame format, refer to [Migrate to data frames](../../migration-guides/update-from-grafana-versions/v6.x-v7.x.md).

:::

## Create a data frame

If you build a data source plugin, then you'll most likely want to convert a response from an external API to a data frame. Let's look at how to do this.

Let's start with creating a simple data frame that represents a time series. The easiest way to create a data frame is to use the `toDataFrame` function.

```ts
// Need to be of the same length.
const timeValues = [1599471973065, 1599471975729];
const numberValues = [12.3, 28.6];

// Create data frame from values.
const frame = toDataFrame({
  name: 'http_requests_total',
  fields: [
    { name: 'Time', type: FieldType.time, values: timeValues },
    { name: 'Value', type: FieldType.number, values: numberValues },
  ],
});
```

:::note

Data frames representing time series contain at least a `time` field and a `number` field. By convention, built-in plugins use `Time` and `Value` as field names for data frames containing time series data.

:::

As you can see from the example, to create data frames like this, your data must already be stored as columnar data. If you already have the records in the form of an array of objects, then you can pass it to `toDataFrame`. In this case, `toDataFrame` tries to guess the schema based on the types and names of the objects in the array. To create complex data frames this way, be sure to verify that you get the schema you expect.

```ts
const series = [
  { Time: 1599471973065, Value: 12.3 },
  { Time: 1599471975729, Value: 28.6 },
];

const frame = toDataFrame(series);
frame.name = 'http_requests_total';
```

## See also

- [Introduction to data frames](../../key-concepts/data-frames.md)
- [Read data from a data source](../../how-to-guides/panel-plugins/read-data-from-a-data-source.md)
