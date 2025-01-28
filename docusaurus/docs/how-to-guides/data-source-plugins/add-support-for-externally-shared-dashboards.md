---
id: add-support-for-externally-shared-dashboards
title: Add support for externally shared dashboards
description: How to add support for externally share dashboards (previously called Public dashboards).
keywords:
  - grafana
  - plugins
  - plugin
  - externally shared dashboards
  - public dashboards
  - data source
  - datasource
---

Externally shared dashboards (previously called Public dashboards) retrieve the query from the backend, instead of receiving it from the frontend. That is due to security purposes, to not expose sensitive data and also not be able to perform unauthorized queries.

Because of that, it is necessary to not pass any frontend-transformed body to the request, as it will not be used in the externally shared dashboard panel request.

:::note

Frontend data sources are not compatible with externally shared dashboards.
To convert a frontend data source plugin into a backend plugin, see
[convert a frontend data source to backend](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/convert-a-frontend-datasource-to-backend).

:::

## Support externally shared dashboards feature in your data source plugin

To make your data source plugin work in an externally shared dashboard scope, it is necessary to:

1.  Extend your DataSource class from `DataSourceWithBackend`

    ```ts
    export class MyDataSourceClass extends DataSourceWithBackend<TQuery, TOptions> {
      // your logic
    }
    ```

2.  Implement the `query` method with your customized code, if necessary.

3.  In the `query` method, do not transform the request body if this will change the backend query response (targets property). This body will not be passed as argument when calling shared externally dashboard endpoint.

4.  Then, in the `query` method, call `super.query(request)`.
    That's where externally shared dashboard endpoint is called.

          ```ts
        export class MyDataSourceClass extends DataSourceWithBackend<TQuery, TOptions> {

           query(request: DataQueryRequest<TQuery>): Observable<DataQueryResponse> {
            // your logic
             return super.query(request);
           }
        }

    ```

    ```

5.  Add `"backend": true` to your `plugin.json`

    ```json title="src/plugin.json"
    "backend": true
    ```
