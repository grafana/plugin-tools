---
id: data-frames
title: Data frames
description: Learn about data frames for use in Grafana plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - data frames
  - dataframes
sidebar_position: 40
---

# Data frames

Grafana supports a variety of different data sources, each with its own data model. To simplify data management, Grafana consolidates the query results from each of these data sources into one unified data structure called a _data frame_.

This document gives you an overview of the data frame structure and how Grafana handles data. You'll learn about field configurations, data transformations, and different data frame formats.

## Data frame fields

A data frame is a collection of _fields_, where each field corresponds to a column. Each field, in turn, consists of a collection of values and metadata, such as the data type of those values.

```ts
export interface Field<T = any, V = Vector<T>> {
  /**
   * Name of the field (column)
   */
  name: string;
  /**
   *  Field value type (string, number, and so on)
   */
  type: FieldType;
  /**
   *  Meta info about how field and how to display it
   */
  config: FieldConfig;

  /**
   * The raw field values
   * In Grafana 10, this accepts both simple arrays and the Vector interface
   * In Grafana 11, the Vector interface has been removed
   */
  values: V | T[];

  /**
   * When type === FieldType.Time, this can optionally store
   * the nanosecond-precison fractions as integers between
   * 0 and 999999.
   */
  nanos?: number[];

  labels?: Labels;

  /**
   * Cached values with appropriate display and id values
   */
  state?: FieldState | null;

  /**
   * Convert a value for display
   */
  display?: DisplayProcessor;

  /**
   * Get value data links with variables interpolated
   */
  getLinks?: (config: ValueLinkConfig) => Array<LinkModel<Field>>;
}
```

Let's look at an example. The following table shows a data frame with two fields, _time_ and _temperature_:

| time                | temperature |
| ------------------- | ----------- |
| 2020-01-02 03:04:00 | 45.0        |
| 2020-01-02 03:05:00 | 47.0        |
| 2020-01-02 03:06:00 | 48.0        |

Each field has three values, and each value in a field must share the same type. In this case, all values in the `time` field are timestamps, and all values in the `temperature` field are numbers.

While time fields represent timestamps, the type of the values should be `Number` (TypeScript) or `time.Time` (Golang).

Another restriction on time fields in date frames concerns converting numbers. In the plugin frontend code, you can convert other formats to `Number` using the function [`ensureTimeField`](https://github.com/grafana/grafana/blob/3e24a500bf43b30360faf9f32465281cc0ff996d/packages/grafana-data/src/transformations/transformers/convertFieldType.ts#L245-L257) from the `@grafana/data` package. This function converts strings following the ISO 8601 format (for example, `2017-07-19 00:00:00.000`), JavaScript `DateTime`s and strings with relative times (for example, `now-10s`) to `Numbers`.

One restriction on data frames is that all fields in the frame must be of the same length to be a valid data frame.

## Field configurations

Each field in a data frame contains optional information about the values in the field, such as units, scaling, and so on.

By adding field configurations to a data frame, Grafana can configure visualizations automatically. For example, you can configure Grafana to automatically set the unit provided by the data source.

## Data transformations

Field configs contain type information; additionally, data frame fields enable _data transformations_ within Grafana.

A data transformation is any function that accepts a data frame as input, and returns another data frame as output. By using data frames in your plugin, you get a range of transformations for free.

To learn more about data transformations in Grafana, refer to [Transform data](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data).

## Data frames as time series

A data frame with at least one time field is considered a _time series_. For more information, refer to [Introduction to time series](https://grafana.com/docs/grafana/latest/fundamentals/timeseries/).

### Wide format

When a collection of time series shares the same _time index_, the time fields in each time series are identical, and you can store them together in a _wide_ format. By reusing the time field, less data is sent to the browser.

In this example, the `cpu` usage from each host shares the time index, so you can store them in the same data frame:

```text
Name: Wide
Dimensions: 3 fields by 2 rows
+---------------------+-----------------+-----------------+
| Name: time          | Name: cpu       | Name: cpu       |
| Labels:             | Labels: host=a  | Labels: host=b  |
| Type: []time.Time   | Type: []float64 | Type: []float64 |
+---------------------+-----------------+-----------------+
| 2020-01-02 03:04:00 | 3               | 4               |
| 2020-01-02 03:05:00 | 6               | 7               |
+---------------------+-----------------+-----------------+
```

However, if the two time series don't share the same time values, they're represented as two distinct data frames:

```text
Name: cpu
Dimensions: 2 fields by 2 rows
+---------------------+-----------------+
| Name: time          | Name: cpu       |
| Labels:             | Labels: host=a  |
| Type: []time.Time   | Type: []float64 |
+---------------------+-----------------+
| 2020-01-02 03:04:00 | 3               |
| 2020-01-02 03:05:00 | 6               |
+---------------------+-----------------+

Name: cpu
Dimensions: 2 fields by 2 rows
+---------------------+-----------------+
| Name: time          | Name: cpu       |
| Labels:             | Labels: host=b  |
| Type: []time.Time   | Type: []float64 |
+---------------------+-----------------+
| 2020-01-02 03:04:01 | 4               |
| 2020-01-02 03:05:01 | 7               |
+---------------------+-----------------+
```

A typical use for the wide format is when multiple time series are collected by the same process. In this case, every measurement is made at the same interval and therefore shares the same time values.

### Long format

Some data sources return data in a _long_ format (also called _narrow_ format). SQL databases commonly return this format.

In the long format, string values are represented as separate fields rather than as labels. As a result, a data frame in long form may have duplicated time values.

With the Grafana plugin SDK for Go, a plugin can detect and convert data frames in long format into wide format.

To detect and convert a data frame, refer to this example:

```go
tsSchema := frame.TimeSeriesSchema()
if tsSchema.Type == data.TimeSeriesTypeLong {
	wideFrame, err := data.LongToWide(frame, nil)
	if err != nil {
		// handle error
	}
	// return wideFrame
}
```

Here's an additional example. The following data frame shows the long format:

```text
Name: Long
Dimensions: 4 fields by 4 rows
+---------------------+-----------------+-----------------+----------------+
| Name: time          | Name: aMetric   | Name: bMetric   | Name: host     |
| Labels:             | Labels:         | Labels:         | Labels:        |
| Type: []time.Time   | Type: []float64 | Type: []float64 | Type: []string |
+---------------------+-----------------+-----------------+----------------+
| 2020-01-02 03:04:00 | 2               | 10              | foo            |
| 2020-01-02 03:04:00 | 5               | 15              | bar            |
| 2020-01-02 03:05:00 | 3               | 11              | foo            |
| 2020-01-02 03:05:00 | 6               | 16              | bar            |
+---------------------+-----------------+-----------------+----------------+
```

You can convert the above table into a data frame in wide format:

```text
Name: Wide
Dimensions: 5 fields by 2 rows
+---------------------+------------------+------------------+------------------+------------------+
| Name: time          | Name: aMetric    | Name: bMetric    | Name: aMetric    | Name: bMetric    |
| Labels:             | Labels: host=foo | Labels: host=foo | Labels: host=bar | Labels: host=bar |
| Type: []time.Time   | Type: []float64  | Type: []float64  | Type: []float64  | Type: []float64  |
+---------------------+------------------+------------------+------------------+------------------+
| 2020-01-02 03:04:00 | 2                | 10               | 5                | 15               |
| 2020-01-02 03:05:00 | 3                | 11               | 6                | 16               |
+---------------------+------------------+------------------+------------------+------------------+
```

:::note

Not all panels support the wide time series data frame format. To keep full backward compatibility, Grafana has introduced a transformation that you can use to convert from the wide to the long format. For usage information, refer to the [Prepare time series-transformation](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data#prepare-time-series).

:::

## Learn more

For a guide to plugin development with data frames, refer to [Create data frames](../how-to-guides/data-source-plugins/create-data-frames).

To learn more about data frames and their relationship with the data plane contract refer to [Grafana data structure](https://grafana.com/developers/dataplane/dataplane-dataframes).

