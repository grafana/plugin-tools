---
id: logs-api
title: Log data sources API reference guides
description: API reference guides for working with data sources with logs.
keywords:
  - grafana
  - plugins
  - plugin
  - data source
  - datasource
  - log
  - logs
  - api
---

You can use the following APIs **to work with data sources with logs within the [`grafana/grafana`](https://github.com/grafana/grafana) repository**. They are not supported for external plugin developers.

:::note
For information on how to build a data source plugin with logs refer to [Build a logs data source plugin](../tutorials/build-a-logs-data-source-plugin). 
:::

## Show full-range logs volume

:::note

Implement it in the data source with the `DataSourceWithXXXSupport` interface.

:::

With [full range logs volume](https://grafana.com/docs/grafana/latest/explore/logs-integration/#logs-volume), Explore displays a graph showing the log distribution for all the entered log queries. To add full-range logs volume support to the data source plugin, use the `DataSourceWithSupplementaryQueriesSupport` API.

**How to implement `DataSourceWithSupplementaryQueriesSupport` API in data source:**

:::note

This API must be implemented in data source in typescript code.

:::

```ts
import {
  DataSourceWithSupplementaryQueriesSupport,
  LogLevel,
  SupplementaryQueryOptions,
  SupplementaryQueryType,
} from '@grafana/data';

export class ExampleDatasource
  extends DataSourceApi<ExampleQuery, ExampleOptions>
  implements DataSourceWithSupplementaryQueriesSupport<ExampleQuery>
{
  // Returns supplementary query types that data source supports.
  getSupportedSupplementaryQueryTypes(): SupplementaryQueryType[] {
    return [SupplementaryQueryType.LogsVolume];
  }

  // Returns a supplementary query to be used to fetch supplementary data based on the provided type and original query.
  // If provided query is not suitable for provided supplementary query type, undefined should be returned.
  getSupplementaryQuery(options: SupplementaryQueryOptions, query: ExampleQuery): ExampleQuery | undefined {
    if (!this.getSupportedSupplementaryQueryTypes().includes(options.type)) {
      return undefined;
    }

    switch (options.type) {
      case SupplementaryQueryType.LogsVolume:
        // This is a mocked implementation. Be sure to adjust this based on your data source logic.
        return { ...query, refId: `logs-volume-${query.refId}`, queryType: 'count' };
      default:
        return undefined;
    }
  }

  // It generates a DataQueryRequest for a specific supplementary query type.
  // @returns A DataQueryRequest for the supplementary queries or undefined if not supported.
  getSupplementaryRequest(
    type: SupplementaryQueryType,
    request: DataQueryRequest<ExampleQuery>,
    options?: SupplementaryQueryOptions
  ): DataQueryRequest<ExampleQuery> | undefined {
    if (!this.getSupportedSupplementaryQueryTypes().includes(type)) {
      return undefined;
    }

    switch (type) {
      case SupplementaryQueryType.LogsVolume:
        const logsVolumeOption: LogsVolumeOption =
          options?.type === SupplementaryQueryType.LogsVolume ? options : { type };
        return this.getLogsVolumeDataProvider(request, logsVolumeOption);
      default:
        return undefined;
    }
  }

  // Be sure to adjust this example based your data source logic.
  private getLogsVolumeDataProvider(
    request: DataQueryRequest<ExampleQuery>,
    options: LogsVolumeOption
  ): DataQueryRequest<ExampleQuery> | undefined {
    const logsVolumeRequest = cloneDeep(request);
    const targets = logsVolumeRequest.targets
      .map((query) => this.getSupplementaryQuery(options, query))
      .filter((query): query is ExampleQuery => !!query);

    if (!targets.length) {
      return undefined;
    }

    return { ...logsVolumeRequest, targets };
}
```

## Logs sample

:::note

Implement this API in a data source by implementing the `DataSourceWithXXXSupport` interface.

:::

The [logs sample](https://grafana.com/docs/grafana/latest/explore/logs-integration/#logs-sample) feature is a valuable addition when your data source supports both logs and metrics. It enables users to view samples of log lines that contributed to the visualized metrics, providing deeper insights into the data.

To implement the logs sample support in your data source plugin, you can use the `DataSourceWithSupplementaryQueriesSupport` API.

```ts
import {
  DataSourceWithSupplementaryQueriesSupport,
  SupplementaryQueryOptions,
  SupplementaryQueryType,
} from '@grafana/data';

export class ExampleDatasource
  extends DataSourceApi<ExampleQuery, ExampleOptions>
  implements DataSourceWithSupplementaryQueriesSupport<ExampleQuery>
{
  // Returns supplementary query types that data source supports.
  getSupportedSupplementaryQueryTypes(): SupplementaryQueryType[] {
    return [SupplementaryQueryType.LogsSample];
  }

  // Returns a supplementary query to be used to fetch supplementary data based on the provided type and original query.
  // If provided query is not suitable for provided supplementary query type, undefined should be returned.
  getSupplementaryQuery(options: SupplementaryQueryOptions, query: ExampleQuery): ExampleQuery | undefined {
    if (!this.getSupportedSupplementaryQueryTypes().includes(options.type)) {
      return undefined;
    }

    switch (options.type) {
      case SupplementaryQueryType.LogsSample:
        // Be sure to adjust this example based on your data source logic.
        return { ...query, refId: `logs-sample-${query.refId}`, queryType: 'logs' };
      default:
        return undefined;
    }
  }

  // It generates a DataQueryRequest for a specific supplementary query type.
  // @returns A DataQueryRequest for the supplementary queries or undefined if not supported.
  getSupplementaryRequest(
    type: SupplementaryQueryType,
    request: DataQueryRequest<ExampleQuery>,
    options?: SupplementaryQueryOptions
  ): DataQueryRequest<ExampleQuery> | undefined {
    if (!this.getSupportedSupplementaryQueryTypes().includes(type)) {
      return undefined;
    }

    switch (type) {
      case SupplementaryQueryType.LogsSample:
        const logsSampleOption: LogsSampleOptions =
          options?.type === SupplementaryQueryType.LogsSample ? options : { type };
        return this.getLogsSampleDataProvider(request, logsSampleOption);
      default:
        return undefined;
    }
  }
  
  private getLogsSampleDataProvider(
    request: DataQueryRequest<ExampleQuery>,
    options?: LogsSampleOptions
  ): DataQueryRequest<ExampleQuery> | undefined {
    const logsSampleRequest = cloneDeep(request);
    const targets = logsSampleRequest.targets
      .map((query) => this.getSupplementaryQuery({ type: SupplementaryQueryType.LogsSample, limit: 100 }, query))
      .filter((query): query is ExampleQuery => !!query);

    if (!targets.length) {
      return undefined;
    }
    return { ...logsSampleRequest, targets };
  }
}
```

For an example of how to implement the logs sample in the Elasticsearch data source, refer to [PR 70258](https://github.com/grafana/grafana/pull/70258/).

## Logs to trace using internal data links

:::note

This feature is currently not supported for external plugins outside of the Grafana repo. The `@internal` API is currently under development.

:::

If you are developing a data source plugin that handles both logs and traces, and your log data contains trace IDs, you can enhance your log data frames by adding a field with trace ID values and internal data links. These links should use the trace ID value to accurately create a trace query that produces relevant trace. This enhancement enables users to seamlessly move from log lines to the traces.

**Example in TypeScript:**

```ts
import { createDataFrame } from '@grafana/data';

const result = createDataFrame({
  fields: [
    ...,
    { name: 'traceID',
      type: FieldType.string,
      values: ['a006649127e371903a2de979', 'e206649127z371903c3be12q' 'k777549127c371903a2lw34'],
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

## Log context query editor

:::note

This feature is currently not supported for external plugins outside of the Grafana repo. The`@alpha` API is currently under development.

:::

It allows plugin developers to display a custom UI in the context view by implementing the `getLogRowContextUi?(row: LogRowModel, runContextQuery?: () => void, origQuery?: TQuery): React.ReactNode;` method.

