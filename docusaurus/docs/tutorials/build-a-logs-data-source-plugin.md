---
id: build-a-logs-data-source-plugin
title: Build a logs data source plugin
sidebar_position: 20
description: Learn how to build a logs data source plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - logs
  - logs data source
  - datasource
---

# Build a logs data source plugin

Grafana data source plugins support metrics, logs, and other data types. The steps to build a logs data source plugin are largely the same as for a metrics data source, but there are a few differences which we will explain in this guide.

## Before you begin

This guide assumes that you're already familiar with how to [Build a data source plugin](./build-a-data-source-plugin.md) for metrics. Review this material before proceeding with this guide.

## Add logs support to your data source

To add logs support to an existing data source:

1. [Enable logs support](#enable-logs-support)
1. [Build the logs data frame](#build-the-logs-data-frame)
1. Optionally, you can improve the user experience with one or more [optional features](#enhance-your-logs-data-source-plugin-with-optional-features).

## Enable logs support

Add `"logs": true` to the [plugin.json](../reference/metadata.md) file to tell Grafana that your data source plugin can return log data:

```json title="src/plugin.json"
{
  "logs": true
}
```

## Build the logs data frame

Grafana supports a variety of different data sources. To make this possible, Grafana consolidates the query results from each of these data sources into one unified data structure called a _data frame_, a collection of fields organized as columns. Each field, in turn, consists of a collection of values and metadata. Learn more in [Data frames](../key-concepts/data-frames).

The _log data frame_ can include the following fields:

| Field name    | Field type                                      | Required field | Description                                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **timestamp** | `time`                                          | required       | Timestamp, non-nullable.                                                                                                                                                                                                                      |
| **body**      | `string`                                        | required       | Content of the log line, non-nullable.                                                                                                                                                                                                        |
| **severity**  | `string`                                        | optional       | Severity/level of the log line. If no severity field is found, consumers/client will decide the log level. More information about log levels, refer to [Logs integration](https://grafana.com/docs/grafana/latest/explore/logs-integration/). |
| **id**        | `string`                                        | optional       | Unique identifier of the log line.                                                                                                                                                                                                            |
| **labels**    | `json raw message` (Go) or `other` (TypeScript) | optional       | Additional labels of the log line. Other systems may refer to this with different names, such as "attributes". Represent its value as `Record<string,any>` type in JavaScript.                                                                |

Logs data frame's `type` needs to be set to `type: DataFrameType.LogLines` in data frame's meta.

### Example: Build a logs data frame in Go

```go
frame := data.NewFrame(
   "logs",
  data.NewField("timestamp", nil, []time.Time{time.UnixMilli(1645030244810), time.UnixMilli(1645030247027), time.UnixMilli(1645030247027)}),
  data.NewField("body", nil, []string{"message one", "message two", "message three"}),
  data.NewField("severity", nil, []string{"critical", "error", "warning"}),
  data.NewField("id", nil, []string{"xxx-001", "xyz-002", "111-003"}),
  data.NewField("labels", nil, []json.RawMessage{[]byte(`{}`), []byte(`{"hello":"world"}`), []byte(`{"hello":"world", "foo": 123.45, "bar" :["yellow","red"], "baz" : { "name": "alice" }}`)}),
)

frame.SetMeta(&data.FrameMeta{
	Type:   data.FrameTypeLogLines,
})
```

### Example: Build a logs data frame in Go TypeScript

```ts
import { createDataFrame, DataFrameType, FieldType } from '@grafana/data';

const result = createDataFrame({
  fields: [
    { name: 'timestamp', type: FieldType.time, values: [1645030244810, 1645030247027, 1645030247027] },
    { name: 'body', type: FieldType.string, values: ['message one', 'message two', 'message three'] },
    { name: 'severity', type: FieldType.string, values: ['critical', 'error', 'warning'] },
    { name: 'id', type: FieldType.string, values: ['xxx-001', 'xyz-002', '111-003'] },
    {
      name: 'labels',
      type: FieldType.other,
      values: [{}, { hello: 'world' }, { hello: 'world', foo: 123.45, bar: ['yellow', 'red'], baz: { name: 'alice' } }],
    },
  ],
  meta: {
    type: DataFrameType.LogLines,
  },
});
```

## Enhance your logs data source plugin with optional features

[Explore](https://grafana.com/docs/grafana/latest/explore/) provides a useful interface for investigating incidents and troubleshooting logs. If your data source produces log results, you can implement the following APIs to allow your users to get the most out of the logs UI and its features within Explore.

:::note
For more information on the available APIs for data sources, refer to [Data sources API reference guide](../reference/datasource-apis.md).
:::

### Show log results in Explore's Logs view

To ensure that your log results are displayed in an interactive Logs view, you must add a `meta` attribute to `preferredVisualisationType` in your log result data frame.

**Example in Go:**

```go
frame.Meta = &data.FrameMeta{
	PreferredVisualization: "logs",
}
```

**Example in TypeScript:**

```ts
import { createDataFrame } from '@grafana/data';

const result = createDataFrame({
    fields: [...],
    meta: {
        preferredVisualisationType: 'logs',
    },
});
```

### Highlight searched words

:::note

Implement this feature in the data frame as a meta attribute.

:::

The logs visualization can [highlight specific words or strings](https://grafana.com/docs/grafana/latest/explore/logs-integration/#highlight-searched-words) in log entries. This feature is typically used for highlighting search terms, making it easier for users to locate and focus on relevant information in the logs. For the highlighting to work, you must include search words in the data frame's `meta` information.

**Example in Go:**

```go
frame.Meta = &data.FrameMeta{
	Custom: map[string]interface{}{
    "searchWords": []string{"foo", "bar", "baz"} ,
  }
}
```

**Example in TypeScript:**

```ts
import { createDataFrame } from '@grafana/data';

const result = createDataFrame({
    fields: [...],
    meta: {
      custom: {
        searchWords: ["foo", "bar", "baz"],
      }
    },
});
```

### Log result `meta` information

:::note

Implement this feature in the data frame as a meta attribute or as a field.

:::

[Log result meta information](https://grafana.com/docs/grafana/latest/explore/logs-integration/#log-result-meta-information) can be used to communicate information about logs results to the user. The following information can be shared with the user:

- **Count of received logs vs limit**: Displays the count of received logs compared to the specified limit. Data frames should set a limit with a meta attribute for the number of requested log lines.
- **Error**: Displays possible errors in your log results. Data frames should to have an `error` in the `meta` attribute.
- **Common labels**: Displays labels present in the `labels` data frame field that are the same for all displayed log lines. This feature is supported for data sources that produce log data frames with an labels field. Refer to [Build the logs data frame](#build-the-logs-data-frame) for more information.

**Example in Go:**

```go
frame.Meta = &data.FrameMeta{
	Custom: map[string]interface{}{
    "limit": 1000,
    "error": "Error information",
  }
}
```

**Example in TypeScript:**

```ts
import { createDataFrame } from '@grafana/data';

const result = createDataFrame({
    fields: [...],
    meta: {
      custom: {
        limit: 1000,
        error: "Error information"
      }
    },
});
```

### Logs-to-trace using internal data links

If your log data contains **trace IDs**, you can enhance your log data frames by adding a field with _trace ID values_ and _URL data links_. These links use the trace ID value to accurately create a trace query that produces the relevant trace. This enhancement enables users to seamlessly move from log lines to the relevant traces.

For example:

```ts
import { createDataFrame, FieldType } from '@grafana/data';

const result = createDataFrame({
  fields: [
    ...,
    { name: 'traceID',
      type: FieldType.string,
      values: ['a006649127e371903a2de979', 'e206649127z371903c3be12q' 'k777549127c371903a2lw34'],
      config: {
        links: [
          {
            // Be sure to adjust this example based on your data source logic.
            title: 'Trace view',
            url: `http://linkToTraceID/${__value.raw}` // ${__value.raw} is a variable that will be replaced with actual traceID value.
          }
        ]
      }
    }
  ],
  ...,
});
```

Another example:

```ts
import { createDataFrame, FieldType } from '@grafana/data';

const result = createDataFrame({
  fields: [
    ...,
    { name: 'traceID',
      type: FieldType.string,
      values: ['a006649127e371903a2de979', 'e206649127z371903c3be12q', 'k777549127c371903a2lw34'],
      config: {
        links: [
          {
            title: 'Trace view',
            url: '',
            internal: {
              // Be sure to adjust this example with datasourceUid, datasourceName and query based on your data source logic.
              datasourceUid: instanceSettings.uid,
              datasourceName: instanceSettings.name,
              query: {
                { ...query, queryType: 'trace', traceId: '${__value.raw}'}, // ${__value.raw} is a variable that will be replaced with actual traceID value.
              }
            }

          }
        ]
      }

    }
  ],
  ...,
});
```

### Color-coded log levels

:::note

Implement this feature in the data frame as a field.

:::

Color-coded [log levels](https://grafana.com/docs/grafana/latest/explore/logs-integration/#log-level) are displayed at the beginning of each log line. They allow users to quickly assess the severity of log entries and facilitate log analysis and troubleshooting. The log level is determined from the `severity` field of the data frame. If the `severity` field isn't present, Grafana tries to evaluate the level based on the content of the log line. If inferring the log level from the content isn't possible, the log level is then set to `unknown`.

Refer to [Build the logs data frame](#build-the-logs-data-frame) for more information.

### Copy link to log line

:::note

Implement this feature in the data frame as a field.

:::

[Copy link to log line](https://grafana.com/docs/grafana/latest/explore/logs-integration/#copy-link-to-log-line) is a feature that allows you to generate a link to a specific log line for easy sharing and referencing. Grafana supports this feature in data sources that produce log data frames with `id` fields.

If the underlying database doesn't return an `id` field, you can implement one within the data source. For example, in the Loki data source, a combination of nanosecond timestamp, labels, and the content of the log line is used to create a unique `id`. On the other hand, Elasticsearch returns an `_id` field that is unique for the specified index. In such cases, to ensure uniqueness, both the `index name` and `_id` are used to create a unique `id`.

Refer to [Build the logs data frame](#build-the-logs-data-frame) for more information.

### Filter fields using log details

:::note

Implement this feature through the data source method.

:::

Every log line has an expandable part called "Log details" that you can open by clicking on the line. Within Log details, Grafana displays [Fields](https://grafana.com/docs/grafana/latest/explore/logs-integration/#fields) associated with that log entry. If the data source implements `modifyQuery?(query: TQuery, action: QueryFixAction): TQuery;` API, then filtering functionality is available for each field. For logs, two filtering options are currently available:

- `ADD_FILTER` - Use to filter for log lines that include selected fields.
- `ADD_FILTER_OUT` - Use to filter for log lines that don't include selected fields.

```ts
export class ExampleDatasource extends DataSourceApi<ExampleQuery, ExampleOptions> {
  modifyQuery(query: ExampleQuery, action: QueryFixAction): ExampleQuery {
    let queryText = query.query ?? '';
    switch (action.type) {
      case 'ADD_FILTER':
        if (action.options?.key && action.options?.value) {
          // Be sure to adjust this example code based on your data source logic.
          queryText = addLabelToQuery(queryText, action.options.key, '=', action.options.value);
        }
        break;
      case 'ADD_FILTER_OUT':
        {
          if (action.options?.key && action.options?.value) {
            // Be sure to adjust this example code based on your data source logic.
            queryText = addLabelToQuery(queryText, action.options.key, '!=', action.options.value);
          }
        }
        break;
    }
    return { ...query, query: queryText };
  }
}
```

### Live tailing

:::note

Implement this feature as a data source method and enable it in `plugin.json`.

:::

[Live tailing](https://grafana.com/docs/grafana/latest/explore/logs-integration/#live-tailing) is a feature that enables real-time log result streaming using Explore. To enable live tailing for your data source, follow these steps:

1. **Enable streaming in `plugin.json`**: In your data source plugin's `plugin.json` file, set the `streaming` attribute to `true`. This allows Explore to recognize and enable live tailing controls for your data source.

```json
{
  "type": "datasource",
  "name": "Example",
  "id": "example",
  "logs": true,
  "streaming": true
}
```

2. Ensure that your data source's `query` method can handle queries with `liveStreaming` set to true.

```ts
export class ExampleDatasource extends DataSourceApi<ExampleQuery, ExampleOptions> {
  query(request: DataQueryRequest<ExampleQuery>): Observable<DataQueryResponse> {
    // This is a mocked implementation. Be sure to adjust this based on your data source logic.
    if (request.liveStreaming) {
      return this.runLiveStreamQuery(request);
    }
    return this.runRegularQuery(request);
  }
}
```

### Log context

Refer to [Log context query editor](../reference/datasource-apis#log-context-query-editor) in the Data source API reference guide for more information.

