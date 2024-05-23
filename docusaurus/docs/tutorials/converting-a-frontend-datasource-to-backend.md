---
id: converting-a-frontend-datasource-to-backend
title: Converting a Frontend data source to have a Backend Component
sidebar_position: 10
description: Learn how to convert a frontend-only data source to a backend data source.
keywords:
  - grafana
  - plugins
  - plugin
  - backend
  - frontend
  - datasource
---

# Converting a Frontend data source to have a Backend Component

This guide walks you through the process of converting an existing frontend only data source plugin into a [backend plugin](https://grafana.com/developers/plugin-tools/introduction/backend-plugins).

To convert a frontend data source, we recommend scaffolding a new backend data source plugin using `npx @grafana/create-plugin@latest`, you can then use the following information to extend this foundation to copy over functionality from your original plugin.

Before we dive into the specifics of converting a frontend data source to a backend data source, it would be better to familiarize yourself with the process of creating a backend data source plugin. Please follow the tutorial to [build a backend plugin](https://grafana.com/developers/plugin-tools/tutorials/build-a-data-source-backend-plugin) before proceeding with this tutorial.

## Primary data source components

Before going into specific conversion advice, we will cover the main components of a data source and how these differ between frontend and backend plugins.

### Frontend Datasource Class

Data source plugins will implement a new DataSourcePlugin which will take as a parameter a DataSource class, which for frontend data sources will extend `DataSourceApi`, and for backend data sources will instead extend `DataSourceWithBackend`. The `DatasourceWithBackend` class already implements most of the required methods so migrating to this will highly simplify the plugin frontend code.

Data source plugins require two components - a Query Editor and a Config Editor.

Examples:

- [Frontend data source](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/datasource-http/src/DataSource.ts#L14)
- [Backend data source](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/datasource-http-backend/src/datasource.ts#L6)

### Query Editor

The query editor allows users to construct a query from a dashboard panel or the Explore view.

This is a frontend component so no changes are _required_. However, by adding a backend component to a data source and thereby being able to make use of `CallResource`, you could potentially enhance a query editor with additional features - such as schema validation.

### Config Editor

The config editor allows users to configure a connection and create a data source instance.

This is a frontend component so no changes are _required_. Config Editors may store sensitive information in `secureJsonData`, and backend plugins can access this information as required - for example as part of handling authentication to the downstream service.

## Plugin structure comparison

The following is an illustrative example of the new components which are introduced as part of adding a backend to the plugin.

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

## Converting functionality

This section describes the specific guidance to follow for converting functionality from the frontend to the backend.

Most plugins only need to implement three methods to be fully functional: a function to run queries, a function to test the data source connection, and any additional GET requests to retrieve different resources (useful to populate the query or config editors).

Apart from that, all the methods usually share the same authentication mechanism against the target data source. Let's start analyzing how to move the authentication logic from the frontend to the backend.

### Authentication

Grafana data sources typically include two types of data: `jsonData` and `secureJsonData`. The former is used to store non-sensitive information, while the latter is used to store sensitive information like passwords or API keys.

Both frontend and backend use the same JSON data to authenticate against the target data source. The main difference is that frontend data sources should read and use credentials for every request while backend data sources should share the same authenticated client between requests. Let's see an example.

In a frontend-only data source, any request that requires authentication needs to go through the plugin-proxy. This translates to defining a `routes` object within the `plugin.json` and specifying there the URL and credentials to use for each request. For example, this defines how to request the given URL setting an `Authorization` header with the `jsonData` credentials:

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

To use this route, the frontend data source should call the `fetch` method from the `DataSourceApi` class. This method will proxy the request and add the `Authorization` header:

```typescript title="src/DataSource.ts"
import { getBackendSrv } from '@grafana/runtime';

const routePath = '/example';

const res = getBackendSrv().datasourceRequest({
  url: this.url + routePath + '/v1/users',
  method: 'GET',
});
// Handle response
```

In a backend data source, the authentication logic should be moved to the `Datasource` constructor. This method is called when the data source is created and should be used to create the authenticated client. This client should be stored in the `Datasource` instance and used for every request. For example:

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

The same principle applies to any other authentication mechanism. For example, for a SQL-based data source, the `Datasource` constructor should create a connection to the database and store it in the `Datasource` instance.

You can see a complete example [here](https://github.com/grafana/grafana-plugin-examples/blob/main/examples/datasource-http-backend/pkg/plugin/datasource.go) and more information about plugin authentication [here](https://grafana.com/developers/plugin-tools/create-a-plugin/extend-a-plugin/add-authentication-for-data-source-plugins#authenticate-using-a-backend-plugin).

### Health check

Once the authentication logic is moved to the backend, the logic to do a health check in the backend should be fairly simple. First, let's see what this may look like for a frontend data source. In this example, the check is doing an API request to `https://api.example.com` (defined in the `routes` field in the `plugin.json`) and returning an error if the request fails:

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

In the case of a backend data source, the `Datasource` struct should implement the `CheckHealth` method. This method should return an error if the data source is not healthy. Let's see the translation of the method above:

:::note

You need to delete the frontend implementation `testDatasource` in your `Datasource` class in the frontend to use the health check in the backend.

:::

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

This covers an HTTP-only data source. For example, if your data source requires a database connection, you can use the Golang client for the database and execute a simple query like `SELECT 1` or a `ping` function.

:::

### Querying

The next step is to move the query logic. This will highly vary depending on how the plugin queries the data source and transforms the response into [frames](https://grafana.com/developers/plugin-tools/introduction/data-frames). In this tutorial, let's see how we can migrate a simple example.

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

Now let's see how this can be translated to the backend. The `Datasource` instance should implement the `QueryData` method. This method should return a list of frames. Let's see the translation of the method above:

:::note

As with the health check, you need to delete the frontend implementation `query` in your `Datasource` class in the frontend.

:::

```go title="pkg/plugin/datasource.go"
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	res, err := d.httpClient.Get(d.settings.URL + "/metrics")
  // Handle errors (omited)

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

Finally, there is a third type of request that plugins may implement even though it's optional. This is what we call "resources". Resources are additional endpoints that the plugin can expose and use to populate the query or config editors. For example, a resource can be used to populate a dropdown with a list of available tables in a database.

In a frontend data source, the plugin should define the resources in the `plugin.json` file as `routes` and use the `fetch` method to get the data. For example (for simplicity, authentication is omitted in this example):

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

To request the resource in the frontend, you can use the methods exposed in the base class `DataSourceWithBackend` (e.g. `getResource` or `postResource`):

```typescript title="src/DataSource.ts"
export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  async getTables() {
    const response = await this.getResource('tables');
    return response;
  }
}
```

## Summary

This tutorial covered the main steps to convert a frontend data source to a backend data source. The total amount of different use cases is vast so if you have any questions or need help with a specific case, please reach out in our [Community forum](https://community.grafana.com/c/plugin-development/30). Contributions to this guide are also welcome.
