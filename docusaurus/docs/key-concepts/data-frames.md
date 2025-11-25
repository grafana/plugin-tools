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

Grafana supports a variety of different data sources, each with its own data model. To make this possible, Grafana consolidates the query results from each of these data sources into one unified data structure called a _data frame_. A data frame is a collection of fields organized as columns. Each field, in turn, consists of a collection of values and metadata, such as units, scaling, and so on. 

## Use data frames

You can use data frame fields to automate configurations. For example, you could configure Grafana to automatically set the unit provided by the data source.

Data frame fields also enable _data transformations_ within Grafana. A data transformation is any function that accepts a data frame as input, and returns another data frame as output. By using data frames in your plugin, you get a range of transformations for free. To learn more about data transformations in Grafana, refer to [Transform data](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data).

## Data frame fields

For a data frame to be valid:

- All fields in the frame must be of the same length.
- Each value from the same field must share the same type.

Let's look at an example. The following table shows a data frame with two fields, _time_ and _temperature_:

| time                | temperature |
| ------------------- | ----------- |
| 2020-01-02 03:04:00 | 45.0        |
| 2020-01-02 03:05:00 | 47.0        |
| 2020-01-02 03:06:00 | 48.0        |

In this case: 

- All values in the `time` field are timestamps, and the type of the values should be `Number` (TypeScript) or `time.Time` (Golang).
- All values in the `temperature` field are numbers.

### Convert other types to numbers

In the plugin frontend code you can use the function [`ensureTimeField`](https://github.com/grafana/grafana/blob/3e24a500bf43b30360faf9f32465281cc0ff996d/packages/grafana-data/src/transformations/transformers/convertFieldType.ts#L245-L257) from the `@grafana/data` package to convert other formats to `Number`. 

This function converts strings following the ISO 8601 format (for example, `2017-07-19 00:00:00.000`), JavaScript's `Date` objects, and strings with relative times (for example, `now-10s`) to `Numbers`.

## Available data frames

The following data frame types are available:

- [Time series](https://grafana.com/developers/dataplane/timeseries)
- [Numeric](https://grafana.com/developers/dataplane/numeric)
- [Heatmap](https://grafana.com/developers/dataplane/heatmap)
- [Logs](https://grafana.com/developers/dataplane/logs)

## Learn more

For a guide to plugin development with data frames, refer to [Create data frames](../how-to-guides/data-source-plugins/create-data-frames).

To learn about the relationship between data frames and the data plane contract, refer to [Grafana data structure](https://grafana.com/developers/dataplane/).

## Example: The time series data frame

A data frame with at least one time field is considered a _time series_.

For more information on time series, refer to our [Introduction to time series](https://grafana.com/docs/grafana/latest/fundamentals/timeseries/).

### Wide format

When a collection of time series shares the same _time index_—the time fields in each time series are identical—they can be stored together, in a _wide_ format. By reusing the time field, less data is sent to the browser.

In this example, the `cpu` usage from each host shares the time index, so we can store them in the same data frame:

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

However, if the two time series don't share the same time values, they are represented as two distinct data frames:

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

Some data sources return data in a _long_ format (also called _narrow_ format). This is a common format returned by, for example, SQL databases. In the long format, string values are represented as separate fields rather than as labels. As a result, a data form in long form may have duplicated time values.

#### Convert long into wide format

With the Grafana plugin SDK for Go, a plugin can detect and convert data frames in long format into wide format:

```go
		tsSchema := frame.TimeSeriesSchema()
		if tsSchema.Type == data.TimeSeriesTypeLong {
			wideFrame, err := data.LongToWide(frame, nil)
			if err == nil {
				// handle error
			}
			// return wideFrame
		}
```

For example, if you have the following data frame in long format:

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

You can convert it into a data frame in wide format like this:

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

Not all panels support the wide time series data frame format. To keep full backward compatibility Grafana has introduced a transformation that you can use to convert from the wide to the long format. For usage information, refer to the [Prepare time series-transformation](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data#prepare-time-series).

:::




