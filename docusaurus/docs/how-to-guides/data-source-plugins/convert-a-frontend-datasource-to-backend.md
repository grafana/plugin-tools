---
id: convert-a-frontend-datasource-to-backend
title: Convert a frontend data source plugin into a backend plugin
description: Learn how to convert a frontend data source plugin into a backend plugin
keywords:
  - grafana
  - plugins
  - plugin
  - backend
  - frontend
  - datasource
---

This guide shows you how to convert an existing frontend-only data source plugin into a [backend plugin](../../key-concepts/backend-plugins).

To convert the frontend data source, we recommend scaffolding a new backend data source plugin using `npx @grafana/create-plugin@latest`. Use the following instructions to extend this foundation to copy functionality from your original plugin.

## Why

There are multiple features available only in backend plugins, such as Grafana Alerting, Recorded queries, or externally shared dashboards (previously called Public dashboards). Refer to the use cases for implementing a backend plugin in the [backend plugins introduction](../../key-concepts/backend-plugins/#use-cases-for-implementing-a-backend-plugin).

## Before you begin

Before you dive into the details, you should familiarize yourself with the process of creating a backend data source plugin. If you haven't done this before, you can follow our tutorial for [building a backend plugin](../../tutorials/build-a-data-source-backend-plugin.md).

## Key concepts

Before going into specific conversion advice, it's important to understand the main components of a data source and how these differ between frontend and backend plugins.

### Frontend `DataSource` class

Data source plugins implement a new `DataSourcePlugin`. This class takes as a parameter a `DataSource` class, which for frontend data sources extends `DataSourceApi`, and for backend data sources extends `DataSourceWithBackend`. Because the `DatasourceWithBackend` class already implements most of the required methods, you can migrate to it to significantly simplify your code.

Data source plugins require two components: a query editor and a config editor.

**Examples:**

- [Frontend data source](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/datasource-http/src/DataSource.ts#L14).
- [Backend data source](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/datasource-http-backend/src/datasource.ts#L6).

### Query and config editor

These two frontend components do not need to be changed when converting a frontend data source to a backend data source. However, if you add a backend component to a data source you can request `resources` from it. Resources are additional endpoints that the plugin exposes and can be used to populate or validate the query or config editor. Learn about this in the [resource requests section](#other-resource-requests).

## Plugin structure comparison

The following folders illustrate the new components that are introduced when you add a backend to the plugin:

```bash
myorg-myplugin-datasource/
├── .config/
├── .eslintrc
├── .github
│   └── workflows
├── .gitignore
├── .nvmrc
├── .prettierrc.js
├── CHANGELOG.md
├── LICENSE
├── Magefile.go # Build definition for backend executable
├── README.md
│   └── integration
├── docker-compose.yaml
├── go.mod # Dependencies
├── go.sum # Checksums
├── jest-setup.js
├── jest.config.js
├── node_modules
├── package.json
├── pkg
│   ├── main.go # Entry point for backend
│   └── plugin # Other plugin packages
├── playwright.config.ts
├── src
│   ├── README.md
│   ├── components
│   ├── datasource.ts
│   ├── img
│   ├── module.ts
│   ├── plugin.json # Modified to include backend=true and executable=<name-of-built-binary>
│   └── types.ts
├── tsconfig.json
└── tests
```

## Convert frontend to backend functions

Most plugins only need to implement three methods to be fully functional: a function to run queries, a function to test the data source connection, and any additional GET requests to retrieve different resources (used to populate the query editor or config editor). All three methods usually share the same authentication mechanism against the target data source.

Now let's discuss how to move the authentication logic from the frontend to the backend.

### Authentication

Grafana data sources typically include two types of data: `jsonData` and `secureJsonData`. The former is used to store non-sensitive information, while the latter is used to store sensitive information like passwords or API keys.

Both frontend and backend types use the same JSON data to authenticate against the target data source. The main difference is that frontend data sources should read and use credentials for every request while backend data sources should share the same authenticated client between requests.

In a frontend-only data source, any request that requires authentication needs to go through the plugin proxy. You need to define a `routes` object within the `plugin.json` file and specify there the URL and credentials to use for each request. For example, you can authenticate a request to a given URL by setting an `Authorization` header with the `SecureJsonData` credentials:

```json title="src/plugin.json"
"routes": [
  {
    "path": "example",
    "url": "https://api.example.com",
    "headers": [
      {
        "name": "Authorization",
        "content": "Bearer {{ .SecureJsonData.apiToken }}"
      }
    ]
  }
]
```

To use this route, the frontend data source should call the `fetch` method from the `DataSourceApi` class. This method proxies the request and adds the `Authorization` header:

```typescript title="src/DataSource.ts"
import { getBackendSrv } from '@grafana/runtime';

const routePath = '/example';

const res = getBackendSrv().datasourceRequest({
  url: this.url + routePath + '/v1/users',
  method: 'GET',
});
// Handle response
```

In a backend data source, you should move the authentication logic to the `Datasource` constructor. This method is called when the data source is created and should be used to create the authenticated client. Store this client in the `Datasource` instance and use it for every request. For example:

```go title="pkg/plugin/datasource.go"
package plugin

import (
  ...
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
  ...
)

func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	opts, err := settings.HTTPClientOptions(ctx)
	if err != nil {
		return nil, fmt.Errorf("http client options: %w", err)
	}
	opts.Header.Add("Authorization", "Bearer " + settings.DecryptedSecureJSONData["token"])

 	cli, err := httpclient.New(opts)
	if err != nil {
		return nil, fmt.Errorf("httpclient new: %w", err)
	}

	return &Datasource{
		httpClient: cl,
	}, nil
}

// In any other method
res, err := d.httpClient.Get("https://api.example.com/v1/users")
// Handle response
```

The same principle applies to any other authentication mechanism. For example, SQL-based data sources should use the `Datasource` constructor to create a connection to the database and store it in the `Datasource` instance.

You can refer to [this example](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/datasource-http-backend/pkg/plugin/datasource.go) and get more information about [plugin authentication](./add-authentication-for-data-source-plugins#authenticate-using-a-backend-plugin).

### Health check

Once you move authentication logic to the backend, you can do a health check in the backend.

:::note

You need to delete the frontend implementation `testDatasource` in your `Datasource` class in the frontend to use the health check in the backend.

:::

In this frontend example, the health check makes an API request to `https://api.example.com` (as defined in the `routes` field in `plugin.json`) and returns an error if the request fails:

```typescript title="src/DataSource.ts"
import { getBackendSrv } from '@grafana/runtime';

const routePath = '/example';

export class MyDatasource extends DataSourceApi<MyQuery, MyDataSourceJsonData> {
  ...

  async testDatasource() {
    try {
      await getBackendSrv().datasourceRequest({
        url: this.url + routePath + '/v1/users',
        method: 'GET',
      });
      return {
        status: 'success',
        message: 'Health check passed.',
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}
```

In the case of a backend data source, the `Datasource` struct should implement the `CheckHealth` method. This method returns an error if the data source is not healthy. For example:

```go title="pkg/plugin/datasource.go"
func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	opts, err := settings.HTTPClientOptions(ctx)
	if err != nil {
		return nil, fmt.Errorf("http client options: %w", err)
	}

	cl, err := httpclient.New(opts)
	if err != nil {
		return nil, fmt.Errorf("httpclient new: %w", err)
	}

return &Datasource{
		settings:   settings,
		httpClient: cl,
	}, nil
}

func (d *Datasource) CheckHealth(ctx context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	resp, err := d.httpClient.Get(d.settings.URL + "/v1/users")
	if err != nil {
    // Log the error here
  	return &backend.CheckHealthResult{
	  	Status: backend.HealthStatusError,
		  Message: "request error",
	  }, nil
	}
	if resp.StatusCode != http.StatusOK {
  	return &backend.CheckHealthResult{
	  	Status: backend.HealthStatusError,
		  Message: fmt.Sprintf("got response code %d", resp.StatusCode),
	  }, nil
	}
	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}
```

:::note

This example covers an HTTP-only data source. So, if your data source requires a database connection, you can use the Go client for the database and execute a simple query like `SELECT 1` or a `ping` function.

:::

### Query

The next step is to move the query logic. This will significantly vary depending on how the plugin queries the data source and transforms the response into [frames](../../key-concepts/data-frames). In this guide, you'll see how to migrate a simple example.

Our data source is returning a JSON object with a list of `datapoints` when hitting the endpoint `/metrics`. The frontend `query` method transforms those `datapoints` into frames:

```typescript title="src/DataSource.ts"
export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const response = await lastValueFrom(
      getBackendSrv().fetch<DataSourceResponse>({
        url: `${this.url}/metrics`,
        method: 'GET',
      })
    );
    const df: DataFrame = {
      length: response.data.datapoints.length,
      refId: options.targets[0].refId,
      fields: [
        { name: 'Time', values: [], type: FieldType.time, config: {} },
        {
          name: 'Value',
          values: [],
          type: FieldType.number,
          config: {},
        },
      ],
    };
    response.data.datapoints.forEach((datapoint: any) => {
      df.fields[0].values.push(datapoint.time);
      df.fields[1].values.push(datapoint.value);
    });
    return { data: [df] };
  }
}
```

Now let's see how this can be translated to the backend. The `Datasource` instance should implement the `QueryData` method. This method should return a list of frames.

:::note

As with the health check, you need to delete the frontend implementation `query` in your `Datasource` class in the frontend.

:::

The following example shows the preceding method:

```go title="pkg/plugin/datasource.go"
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	res, err := d.httpClient.Get(d.settings.URL + "/metrics")
  // Handle errors (omitted)

	// Decode response
	var body struct {
    DataPoints []apiDataPoint `json:"datapoints"`
	}
	if err := json.NewDecoder(httpResp.Body).Decode(&body); err != nil {
		return backend.DataResponse{}, fmt.Errorf("%w: decode: %s", errRemoteRequest, err)
	}

	// Create slice of values for time and values.
	times := make([]time.Time, len(body.DataPoints))
	values := make([]float64, len(body.DataPoints))
	for i, p := range body.DataPoints {
		times[i] = p.Time
		values[i] = p.Value
	}

	// Create frame and add it to the response
	dataResp := backend.DataResponse{
		Frames: []*data.Frame{
			data.NewFrame(
				"response",
				data.NewField("time", nil, times),
				data.NewField("values", nil, values),
			),
		},
	}
	return dataResp, err
}
```

### Other resource requests

Finally, there is an optional type of request that plugins may implement. This is what we call _resources_. Resources are additional endpoints that the plugin exposes and uses to populate the query editor or config editor. For example, you can use a resource to populate a dropdown menu with a list of available tables in a database.

In a frontend data source, the plugin should define the resources in the `plugin.json` file as `routes` and use the `fetch` method to get the data. For example:

```json title="src/plugin.json"
{
  "routes": [
    {
      "path": "tables",
      "url": "https://api.example.com/api/v1/tables",
      "method": "GET"
    }
  ]
}
```

```typescript title="src/DataSource.ts"
export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  async getTables() {
    const response = await lastValueFrom(
      getBackendSrv().fetch<MetricsResponse>({
        url: `${this.url}/tables`,
        method: 'GET',
      })
    );
    return response.data;
  }
}
```

:::note

To keep things simple, authentication is omitted in this example.

:::

For a backend data source, the plugin should implement the `CallResourceHandler` interface. This interface should handle the different possible resources. For example:

```go title="pkg/plugin/datasource.go"
func NewDatasource(_ context.Context, _ backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &Datasource{
		CallResourceHandler: newResourceHandler(),
	}, nil
}

func newResourceHandler() backend.CallResourceHandler {
	mux := http.NewServeMux()
	mux.HandleFunc("/tables", handleTables)

	return httpadapter.New(mux)
}

func handleTables(w http.ResponseWriter, r *http.Request) {
  // Get tables
  res, err :=	http.DefaultClient.Get("https://api.example.com/api/v1/tables")
  // Handle errors (omited)
	body, err := io.ReadAll(res.Body)
  // Handle errors (omited)

	w.Write(body)
	w.WriteHeader(http.StatusOK)
}
```

To request the resource in the frontend, you can use the methods exposed in the base class `DataSourceWithBackend` (for example, `getResource` or `postResource`):

```typescript title="src/DataSource.ts"
export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  async getTables() {
    const response = await this.getResource('tables');
    return response;
  }
}
```

## Conclusion

This guide covered the main steps to convert a frontend data source into a backend data source. There are a wide variety of plugins so if you have any questions or need help with a specific case, we encourage you to reach out in our [Community forum](https://community.grafana.com/c/plugin-development/30). Contributions to this guide are also welcome.
