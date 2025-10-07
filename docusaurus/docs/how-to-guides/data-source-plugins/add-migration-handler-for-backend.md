---
id: add-migration-handler-for-backend-data-source
title: Add query migrations for a backend data source plugin
sidebar_label: Add query migrations
description: How to add a query migration handler to your Grafana backend data source plugin for seamless updates.
keywords:
  - grafana
  - plugins
  - plugin
  - migration
  - datasource
---

As plugins evolve, significant changes may be required in the query model that the plugin defines. Reasons include major changes in the third-party service the plugin relies on, a refactor, new functionality, and more. When changing a data source query model, plugins should implement migration logic to transform existing queries from the previous format to the latest one. This migration logic should be included both in the backend (for non-frontend originated queries, such as alerts) and in the frontend (to adapt the query to newer versions of the `QueryEditor`).

## Why add query migration handlers

To ensure compatibility and maintain seamless performance, query migration handlers transform legacy queries into the current format. This approach allows you to deliver updates without breaking existing queries or duplicating code, offering users a smooth transition when they update your plugin.

## Before you begin

Depending on the approach you take for performing [one of the steps](#step-5-use-migration-code-from-the-frontend-using-experimental-apis) in this guide, you may need to fulfill certain prerequisites. These prerequisites are:

1. Grafana must be configured to run data sources as standalone API servers, a behavior which is behind the feature flag [grafanaAPIServerWithExperimentalAPIs](https://github.com/grafana/grafana/blob/7773c658bb3280f0432fc9742109f8eb324c83a3/pkg/services/featuremgmt/registry.go#L474).
1. The plugin must be run on a Grafana version 11.4 or later.

More information about these prerequisites is found in [step 5](#step-5-use-migration-code-from-the-frontend-using-experimental-apis), but if your plugin can't adhere to these requirements, there is an [alternative approach](#step-5-alternative-run-migrations-using-legacy-apis) using existing APIs.

## Implement a backend migration handler

To implement a backend migration handler, add migration logic in your backend code. This guide walks you through the steps necessary to use the latest tooling to automatically migrate queries and avoid duplicating code.

:::note

The migration system detailed in this guide doesn't support two-way migrations. Only forward migrations are covered. Query migrations aren't automatically persisted, so users need to manually save changes to ensure the process works as expected.

:::

### Step 1 (optional): Add a query schema

First of all, plugins don't need to have strongly typed queries. While this lowers the barrier for plugin development, plugins that don't define types are harder to scale and maintain. The first step in this guide is to add the required files to define the plugin query.

See the following example: [grafana-plugin-examples#400](https://github.com/grafana/grafana-plugin-examples/pull/400). As you can see, there are multiple files to create. These files will be used for both generating OpenAPI documentation and validating that the received queries are valid (but it's a feature still in progress that isn't available yet).

Create these files:

- `query.go`: This file defines the Golang types for your query. For automatic migrations to work, it's important that your query extends the new `v0alpha1.CommonQueryProperties`. After that, just define your query custom properties.
- `query_test.go`: This test file is both used to check that all the JSON files are up to date with the query model and to generate them. The first time you execute the test, it will generate these files (so take into account that `query.types.json` needs to exist, even if it's empty).
- `query.*.json`: Automatically generated files. These schemas can be used for OpenAPI documentation.

### Step 2: Changing the query model

:::note

For a complete example of how to add a query migration (steps 2, 3 and 4), refer to the code for [experimental APIs](https://github.com/grafana/grafana-plugin-examples/pull/403/files) or [stable APIs](https://github.com/grafana/grafana-plugin-examples/pull/407).

:::

Once your plugin has its own schemas, start introducing model changes. Since queries within the major version (or same API version) need to be compatible, maintain a reference to the legacy data format. This reference also helps to enable an easy migration path.

For example, let's assume that you want to change the query format of your plugin and the `Multiplier` property that you were using is changing to `Multiply` like so:

```diff
 type DataQuery struct {
        v0alpha1.CommonQueryProperties

-       // Multiplier is the number to multiply the input by
+       // Multiply is the number to multiply the input by
+       Multiply int `json:"multiply,omitempty"`
+
+       // Deprecated: Use Multiply instead
        Multiplier int `json:"multiplier,omitempty"`
 }
```

In this example, you can regenerate the schema running the test in `query_test.go` so your new data type will become ready to be used.

Note that there is not yet a breaking change because all the new parameters (in this case `Multiply`) are marked as optional. Also, none of the other business logic has been modified, so everything should work as before, using the deprecated property. In the next step, there is actually a breaking change.

### Step 3: Use the new query format

Modify the plugin code to use the new data model, ignoring the fact that existing dashboards or queries continue to use the old model. Note that you must modify both the frontend and the backend code.

Begin by replacing the use of `Multiplier` with `Multiply`.

Here is a backend example:

```diff
func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, quer
                        return backend.DataResponse{}, fmt.Errorf("unmarshal: %w", err)
                }
                q := req.URL.Query()
-               q.Add("multiplier", strconv.Itoa(input.Multiplier))
+               q.Add("multiplier", strconv.Itoa(input.Multiply))
                req.URL.RawQuery = q.Encode()
        }
        httpResp, err := d.httpClient.Do(req)
```

Here is a frontend example:

```diff
 export class QueryEditor extends PureComponent<Props> {
           type="number"
           id="multiplier"
           name="multiplier"
-          value={this.props.query.multiplier}
-          onChange={(e) => this.props.onChange({ ...this.props.query, multiplier: e.currentTarget.valueAsNumber })}
+          value={this.props.query.multiply}
+          onChange={(e) => this.props.onChange({ ...this.props.query, multiply: e.currentTarget.valueAsNumber })}
         />
       </HorizontalGroup>
     );
```

At this point, there's finally a breaking change. New queries will use the new format and work as expected, but legacy queries won't because they don't define the new property. Let's fix that.

### Step 4: Add migration code in the backend

Create a parsing function in the backend that takes the generic JSON blob that the `QueryData` function receives, and then migrates the format as needed. The function should receive a `backend.DataQuery` and return your own `kinds.DataQuery`.

This function should just unmarshall the JSON from the original `DataQuery` and parse it as your own `DataQuery`, doing any migration necessary. Use this function in your plugin logic. With this change in our example, regardless of whether a query uses the old model (`Multiplier`) or the new one (`Multiply`), both work as expected.

Example:

```diff
func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, quer
                return backend.DataResponse{}, fmt.Errorf("new request with context: %w", err)
        }
        if len(query.JSON) > 0 {
-               input := &kinds.DataQuery{}
-               err = json.Unmarshal(query.JSON, input)
+               input, err := convertQuery(query)
                if err != nil {
-                       return backend.DataResponse{}, fmt.Errorf("unmarshal: %w", err)
+                       return backend.DataResponse{}, err
                }
                q := req.URL.Query()
                q.Add("multiplier", strconv.Itoa(input.Multiply))
...

+func convertQuery(orig backend.DataQuery) (*kinds.DataQuery, error) {
+       input := &kinds.DataQuery{}
+       err := json.Unmarshal(orig.JSON, input)
+       if err != nil {
+               return nil, fmt.Errorf("unmarshal: %w", err)
+       }
+       if input.Multiplier != 0 && input.Multiply == 0 {
+               input.Multiply = input.Multiplier
+               input.Multiplier = 0
+       }
+       return input, nil
+}
```

### Step 5: Use migration code from the frontend (using experimental APIs)

:::note

This feature depends on the feature flag [grafanaAPIServerWithExperimentalAPIs](https://github.com/grafana/grafana/blob/7773c658bb3280f0432fc9742109f8eb324c83a3/pkg/services/featuremgmt/registry.go#L474). It also requires the package **@grafana/runtime > 11.4** (still experimental functionality). If your plugin implements this feature, bump its **grafanaDepencency to ">=11.4.0"**. If your plugin can't adhere to these requirements, refer to [Run migrations using legacy APIs](#step-5-alternative-run-migrations-using-legacy-apis).

:::

You should be able to invoke your `convertQuery` function from the frontend as well as the backend, so our `QueryEditor` component should be able to convert the query to the new format. In order to expose this function to the frontend, the backend needs to implement the `QueryConversionHandler` interface. This is just a wrapper around the `convertQuery` function, but for multiple queries.

Here's an example of a `convertQuery` implementation:

```go title="convert_query.go"
// convertQuery parses a given DataQuery and migrates it if necessary.
func convertQuery(orig backend.DataQuery) (*kinds.DataQuery, error) {
	input := &kinds.DataQuery{}
	err := json.Unmarshal(orig.JSON, input)
	if err != nil {
		return nil, fmt.Errorf("unmarshal: %w", err)
	}
	if input.Multiplier != 0 && input.Multiply == 0 {
		input.Multiply = input.Multiplier
		input.Multiplier = 0
	}
	return input, nil
}

// convertQueryRequest migrates a given QueryDataRequest which can contain multiple queries.
func convertQueryRequest(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryConversionResponse, error) {
	queries := make([]any, 0, len(req.Queries))
	for _, q := range req.Queries {
		input, err := convertQuery(q)
		if err != nil {
			return nil, err
		}
		q.JSON, err = json.Marshal(input)
		if err != nil {
			return nil, fmt.Errorf("marshal: %w", err)
		}
		queries = append(queries, q)
	}
	return &backend.QueryConversionResponse{
		Queries: queries,
	}, nil
}
```

Finally, adapt the frontend so `@grafana/runtime` knows if it should run the migration action. Do this in two steps:

1. Implement the `MigrationHandler` that `@grafana/runtime` exposes in the plugin's `DataSource` class. Set the property `hasBackendMigration` (to `true`) and implement the function `shouldMigrate`. The `shouldMigrate` function receives a query and verifies if it requires migration (for example, by checking the latest properties or checking the expected plugin version, if it's part of the model). This verification avoids unnecessary queries to the backend.
1. Use the wrapper `QueryEditorWithMigration` along with your `QueryEditor` component. This wrapper will ensure that the query is migrated before rendering the editor.

That's it. Once the plugin implements these steps, existing and new queries will continue working without the need for duplicate migration logic in multiple places.

:::note

To see how steps 2 to 5 are done in a complete example, refer to [this example](https://github.com/grafana/grafana-plugin-examples/pull/403/files).

:::

### Step 5 (alternative): Run migrations using legacy APIs

In addition to running migrations using experimental APIs, it's also possible to run them with legacy APIs. There are no additional requirements.

Follow these steps:

1. In the backend, expose the `convertQuery` as a [resource](../../how-to-guides/data-source-plugins/add-resource-handler.md) so you can retrieve it using a resource endpoint like `/migrate-query`.
1. Fix the plugin `QueryEditor`, because legacy queries try to render the old format and the plugin logic isn't prepared for that. To do so, configure the plugin to use the new migration endpoint that was just defined.

:::note

To see how steps 2 to 5 are done in a complete example, refer to [this example](https://github.com/grafana/grafana-plugin-examples/pull/407).

:::

### Step 6 (Optional): Add an AdmissionHandler

:::note

This step is optional. It's only needed if you're running Grafana with the feature flag [grafanaAPIServerWithExperimentalAPIs](https://github.com/grafana/grafana/blob/3457f219be1c8bce99f713d7a907ee339ef38229/pkg/services/featuremgmt/registry.go#L519).

:::

When running Grafana with experimental APIs, each data source will run as an isolated API server. This means that queries will be routed to a server such as `https://<grafana-host>/apis/<datasource>.datasource.grafana.app/v0alpha1/namespaces/stack-1/connections/<uid>/query`.

In this scenario, and to ensure that your plugin runs with the expected API version (`v0alpha1` at the beginning), implement an `AdmissionHandler`. This `AdmissionHandler` ensures that the given data source settings satisfy what's expected for the running API version, and therefore they can handle queries for that API version.

This step isn't mandatory while the plugin is at `v0*`, but it's mandatory once the plugin reaches `v1`. At the moment, it's used to [validate data source settings when saving them](https://github.com/grafana/grafana/blob/a46ff09bf91895ee3de0d8f6c4ab88d70b47bfe6/pkg/services/datasources/service/datasource.go#L373).

The `AdmissionHandler` method should implement two main functions:

- `ValidateAdmission`: That checks whether or not the given entity is valid (in this case, the data source settings).
- `MutateAdmission`: That allows mutation of the entity before storing it.

In [our example](https://github.com/grafana/grafana-plugin-examples/pull/401), both functions are interchangeable since both execute the same code (that is, only validation occurs, and nothing is mutated).

## Conclusion

Adding query migrations allows your Grafana data source plugin to evolve without breaking functionality for existing users. By maintaining migration handlers in both backend and frontend, you ensure compatibility and a smoother user experience through every update.
