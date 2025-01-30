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

Externally shared dashboards (previously called Public dashboards) retrieve the query from the backend, instead of receiving it from the frontend. This is to avoid exposing sensitive data and performing unauthorized queries.

Because of this, it's necessary to not pass any frontend-transformed body to the request, as it won't be used in the externally shared dashboard panel request.

:::note

Frontend data sources are not compatible with externally shared dashboards.
To convert a frontend data source plugin into a backend plugin, refer to
[convert a frontend data source to backend](./convert-a-frontend-datasource-to-backend).

:::

## Support externally shared dashboards in your data source plugin

To make your data source plugin work in an externally shared dashboard scope, follow these steps:

1.  Extend your DataSource class from `DataSourceWithBackend`

    ```ts
    export class MyDataSourceClass extends DataSourceWithBackend<TQuery, TOptions> {
      // your logic
    }
    ```

2.  Implement the `query` method with your customized code, if necessary. Don't transform the request body if this will change the backend query response (targets property). This body won't be passed as argument when calling the shared externally dashboard endpoint.

    Then, call `super.query(request)`.
    This is where the externally shared dashboard endpoint is called.

          ```ts
        export class MyDataSourceClass extends DataSourceWithBackend<TQuery, TOptions> {

           query(request: DataQueryRequest<TQuery>): Observable<DataQueryResponse> {
             // your logic
             return super.query(request).pipe(
                map((response) => {
                    // your logic
                })
             );
           }
        }

3.  Add `"backend": true` to your `plugin.json`

    ```json title="src/plugin.json"
    "backend": true
    ```
