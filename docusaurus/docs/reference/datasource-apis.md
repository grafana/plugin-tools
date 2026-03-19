---
id: datasource-apis
title: Data sources APIs reference guide
description: API reference guides for working with data sources.
keywords:
  - grafana
  - plugins
  - plugin
  - data source
  - datasource
  - log
  - logs
  - api
  - apis
---

Use the `DataSourceWithXXXSupport` interface to expand your data source plugin capabilities. Available APIs include:

- `DataSourceWithSupplementaryQueriesSupport`
- `DataSourceWithLogsContextSupport`
- `DataSourceWithLogsLabelTypesSupport`

:::note
These APIs **only work with data sources within the [`grafana/grafana`](https://github.com/grafana/grafana) repository**. They are not supported for external plugin developers.
:::

## Show full-range logs volume

With [full range logs volume](https://grafana.com/docs/grafana/latest/explore/logs-integration/#logs-volume), Explore displays a graph showing the log distribution for all the entered log queries. 

To add full-range logs volume support to the data source plugin, implement the `DataSourceWithSupplementaryQueriesSupport` API in your data source in TypeScript.

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
}
```

## Implement logs sample support

The [logs sample](https://grafana.com/docs/grafana/latest/explore/logs-integration/#logs-sample) feature enables users to view samples of log lines that contributed to the visualized metrics, providing deeper insights into the data. 

To implement logs sample support in your data source plugin, use the `DataSourceWithSupplementaryQueriesSupport` API.

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

:::note
For an example of how to implement the logs sample in the Elasticsearch data source, refer to [Elasticsearch: Enable logs samples for metric queries](https://github.com/grafana/grafana/pull/70258/).
:::

## Create a log context query editor

[Log context](https://grafana.com/docs/grafana/latest/explore/logs-integration/#log-context) is a feature in Explore that enables the display of additional lines of context surrounding a log entry that matches a specific search query. With this feature users gain deeper insights into the log data by viewing the log entry within its relevant context. Because Grafana will show the surrounding log lines, users can gain a better understanding of the sequence of events and the context in which the log entry occurred, improving log analysis and troubleshooting.

To implement this feature, use the `DataSourceWithLogsContextSupport` interface.

```ts
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceWithLogsContextSupport,
  LogRowContextOptions,
  LogRowContextQueryDirection,
  LogRowModel,
} from '@grafana/data';
import { catchError, lastValueFrom, of, switchMap, Observable } from 'rxjs';

export class ExampleDatasource
  extends DataSourceApi<ExampleQuery, ExampleOptions>
  implements DataSourceWithLogsContextSupport<ExampleQuery>
{
  // Retrieve context for a given log row
  async getLogRowContext(
    row: LogRowModel,
    options?: LogRowContextOptions,
    query?: ExampleQuery
  ): Promise<DataQueryResponse> {
    // Be sure to adjust this example implementation of createRequestFromQuery based on your data source logic.
    // Remember to replace variables with `getTemplateSrv` and the passed `options.scopedVars` before returning your `request` object.
    const request = createRequestFromQuery(row, query, options);
    return lastValueFrom(
      // Be sure to adjust this example of this.query based on your data source logic.
      this.query(request).pipe(
        catchError((err) => {
          const error: DataQueryError = {
            message: 'Error during context query. Please check JS console logs.',
            status: err.status,
            statusText: err.statusText,
          };
          throw error;
        }),
        // Be sure to adjust this example of processResultsToDataQueryResponse based on your data source logic.
        switchMap((res) => of(processResultsToDataQueryResponse(res)))
      )
    );
  }

  // Retrieve the context query object for a given log row. This is currently used to open LogContext queries in a split view.
  getLogRowContextQuery(
    row: LogRowModel,
    options?: LogRowContextOptions,
    query?: ExampleQuery
  ): Promise<ExampleQuery | null> {
    // Data source internal implementation that creates context query based on row, options and original query
  }
}
```

## Use logs with `labelTypes`

The [Log Details](https://grafana.com/docs/grafana-cloud/visualizations/simplified-exploration/logs/view-logs/#log-details) component is the part of the Logs Visualization that displays the available fields and labels that are related with each log line. For data sources that support labels, such as those that follow the Grafana Data Structure [specification](https://grafana.com/developers/dataplane/logs) for logs, and wants to group those labels by different types of categories inside the Log Details component, it is possible by implementing the `DataSourceWithLogsLabelTypesSupport` interface.

The `DataSourceWithLogsLabelTypesSupport` exposes a function that receives the name of the label to resolve the corresponding type, the original logs Data Frame, and the index of the corresponding log line for this label in the Data Frame. The expected return value of this function is the display name of the label category.


```ts
import {  DataSourceWithLogsLabelTypesSupport } from '@grafana/data';

const DATAPLANE_LABEL_TYPES_NAME = 'labelTypes';

export class ExampleDatasource
  extends DataSourceApi<ExampleQuery, ExampleOptions>
  implements DataSourceWithLogsLabelTypesSupport
{
  /**
   * Given a label name, the Data Frame, and the index of the log line, resolve the display name for this label, if it has one.
   * @param labelKey
   * @param frame
   * @param index
   */
  getLabelDisplayTypeFromFrame(labelKey: string, frame: DataFrame | undefined, index: number | null) {
    if (!frame) {
      return null;
    }

    const typeField = frame.fields.find((field) => field.name === DATAPLANE_LABEL_TYPES_NAME);
    if (!typeField) {
      return null;
    }

    // If the log line index is not provided, look for a log line with the same labelKey
    if (index === null) {
      index = typeField.values.findIndex((typeFieldValue) => typeFieldValue[labelKey]);
    }

    const valueTypes = typeField?.values[index];
    switch (valueTypes?.[labelKey]) {
      case 'I':
        return 'Indexed fields';
      case 'S':
        return 'Structured metadata';
      case 'P':
        return 'Parsed fields';
      default:
        return null;
    }
  }
}
```
