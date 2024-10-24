---
id: add-migration-handler-for-backend-data-source
title: Add query migrations for a backend data source plugin
description: How to add a query migration handler to your Grafana backend data source plugin for seamless updates.
keywords:
  - grafana
  - plugins
  - plugin
  - migration
  - datasource
---

As plugins evolve, it may be necessary to add significant changes to the query model that the plugin defines. The reasons can be multiple: a major change in the third party service the plugin relies on, a major refactor or revamp, new functionality, etc. The main issue with changing a datasource query model is that, in order to keep supporting existing queries, datasources should implement migration logic that transforms a query from its previous format to the latest one. This migration logic needs to be placed both in the backend (to execute queries that are not originated from the frontend, like alerts) and in the frontend (to adapt the query to newer versions of the `QueryEditor`). This causes a duplication of code that’s difficult to maintain.

This guide walks you through the steps necessary to use the latest tooling to automatically migrate queries and avoid duplicating code.

For the last step in this guide, there are two suggested approaches. The first one requires that Grafana to be configured to run data source as standalone API servers, this behavior is currently behind the feature flag [grafanaAPIServerWithExperimentalAPIs](https://github.com/grafana/grafana/blob/3457f219be1c8bce99f713d7a907ee339ef38229/pkg/services/featuremgmt/registry.go#L519) and also requires to run on a Grafana version bigger or equal to 11.4. The second approach requires more boilerplate code but uses stable APIs that can be used in any recent Grafana version.

Also, it’s not the goal of this migration system to support two-way migrations. Only forward migrations are supported. Migrations are not automatically persisted, users need to manually save changes to ensure the migration works as expected. 

# Step 1 (optional): Add a query schema

First of all, plugins don’t need to have strongly typed queries. While this lowers the barrier for plugin development, plugins that don’t define types are harder to scale and maintain. The first step in this guide is to add the required files to define the plugin query.

See the following example: [grafana-plugin-examples#400](https://github.com/grafana/grafana-plugin-examples/pull/400). As you can see, there are multiple files to create. These will be used for both generating OpenAPI documentation and validating that the received queries are valid:

 - `query.go`: This file defines the Golang types for your query. For automatic migrations to work, it’s important that your query extends the new `v0alpha1.CommonQueryProperties`. After that, just define your query custom properties.
 - `query_test.go`: This test file is both used to check that all the JSON files are up to date with the query model and to generate them. The first time you execute the test, it will generate these files (take into account that query.types.json needs to exist, even if empty).
 - `query.*.json`: Automatically generated files. These schemas will be used for OpenAPI documentation. This is a feature in progress that is still not available for external plugins.

# Step 2: Making the "breaking" change

:::note

TL;DR: A full example of how to add a query migration (steps 2, 3 and 4) can be found [here for experimental APIs](https://github.com/grafana/grafana-plugin-examples/pull/403/files) or [here for stable APIs](https://github.com/grafana/grafana-plugin-examples/pull/407).

:::

Once the plugin has its own schemas, we can add the "breaking" change. Since queries within the major version (or same API version) need to be compatible, we still need to maintain a reference to the old data format. This will also enable an easy migration path.

For example, let’s assume that we want to change the query format of our plugin and the `Multiplier` property we have been using will change to `Multiply`:

```patch
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

We can regenerate the schema running the test in `query_test.go` and our new data type will be ready to be used. 

Note that this is not yet a breaking change since all new parameters (in this case `Multiply`) are marked as optional. Also, we have not modified any of the business logic so everything should work as before, using the deprecated property. We are going to change that in the next step.

# Step 3: Use the new query format

In this step, we can modify the plugin code to use the new data model, ignoring the fact that existing dashboard or queries will use the old model. Note that we need to modify both the frontend and the backend code.

In our example case we are just going to replace the usage of `Multiplier` with `Multiply`. Some examples in the backend and frontend code:

```patch
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

```patch
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

At this point, this is really a breaking change. New queries will use the new format and work as expected but old ones won't since they don't define the new property. Let's fix that.

# Step 4: Add migration code in the backend

In the backend, create a parsing function that takes the generic JSON blob that the `QueryData` function receives and that migrates the format as needed. The function should receive a `backend.DataQuery` and return your own `kinds.DataQuery`. This function should just unmarshall the JSON from the original `DataQuery` and parse it as your own `DataQuery`, doing any migration necessary. Use this function in your plugin logic. With this change in our example, regardless if a query uses the old model (`Multiplier`) or the new one (`Multiply`), both will work as expected.

```patch
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
+
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

# Step 5: Use migration code from the frontend (using experimental APIs)

:::note

This feature depends on the feature flag [grafanaAPIServerWithExperimentalAPIs](https://github.com/grafana/grafana/blob/build-go-fast/pkg/services/featuremgmt/registry.go#L528). It also requires the package **@grafana/runtime > 11.4** (still experimental functionality). If your plugin implements this feature, it should bump its **grafanaDepencency to ">=11.4.0"**. If these are requirements your plugin cannot abide by, see [Step 4': Add migration (using stable APIs)](#step-4-add-migration-using-stable-apis).

:::

Our goal is to be able to invoke our `convertQuery` function from the frontend as well, so our `QueryEditor` component should be able to convert the query to the new format. In order to expose this function to the frontend, our backend needs to implement the `QueryConversionHandler` interface. This will be just a wrapper around our `convertQuery` function but for multiple queries. See how this was implemented in [our example](https://github.com/grafana/grafana-plugin-examples/pull/403/files#diff-a4ecf4de6bfd217cb4e941334f2b203adb8b400b9784c8fa94f17847f7570871).

Finally, we need to adapt the frontend so `@grafana/runtime` knows if it should run the migration action. This is done in two steps:

 - The plugin `DataSource` class should implement the `MigrationHandler` that `@grafana/runtime` exposes. This is satisfied setting the property `hasBackendMigration` (to `true`) and implementing the function `shouldMigrate`. `shouldMigrate` is a function that receives a query and should verify if it requires migration (e.g. checking the latest properties or checking the expected plugin version, if it’s part of the model). This avoids unnecessary queries to the backend.
 - The plugin `QueryEditor` needs a wrapper that ensures that the given query is migrated before rendering the editor. For doing so, add the `QueryEditorWithMigration` wrapping your query editor.

That's it. Once the plugin implements these steps, existing and new queries will continue working without the need for duplicate migration logic in multiple places.

See how steps 2 to 5 look like for our example [here](https://github.com/grafana/grafana-plugin-examples/pull/403/files).


# Step 5': Use migration code from the frontend (using experimental APIs)

Similar to the above, it’s also possible to run migrations but using legacy APIs. This does not have any additional requirements. These are the steps to follow:

1. In the backend, we need to expose our `convertQuery` as a [resource](../../how-to-guides/data-source-plugins/add-resource-handler.md) so we can retrieve it using a resource enpoint like `/migrate-query`.
2. The remaining item to fix is the plugin QueryEditor since old queries will try to render the old format and our plugin logic is not prepared for that. We are going to configure our plugin to use the new migration endpoint we just defined. 

See how steps 2 to 5' look like for our example [here](https://github.com/grafana/grafana-plugin-examples/pull/407).

# Extra step (optional): Add an AdmissionHandler

:::note

This step is optional and only needed if you are running Grafana with the feature flag [grafanaAPIServerWithExperimentalAPIs](
https://github.com/grafana/grafana/blob/3457f219be1c8bce99f713d7a907ee339ef38229/pkg/services/featuremgmt/registry.go#L519)

:::

When running Grafana with experimental APIs, each datasource will run as its own, isolated, API server. This means that queries will be routed to a server like `https://<grafana-host>/apis/<datasource>.datasource.grafana.app/v0alpha1/namespaces/stack-1/connections/<uid>/query`.

In that scenario and to ensure that your plugin is running with the expected API version (`v0alpha1` at the beginning), you can implement an `AdmissionHandler`. This `AdmissionHandler` ensures that the given datasource settings satisfies what's expected for the running API version and therefore is able to handle queries under that version.

This is not mandatory while the plugin is at `v0*` but it will be once it reaches `v1`. Right now, it’s used to [validate datasource settings when saving it](https://github.com/grafana/grafana/blob/a46ff09bf91895ee3de0d8f6c4ab88d70b47bfe6/pkg/services/datasources/service/datasource.go#L373).

The `AdmissionHandler` have two main functions to implement:

 - `ValidateAdmission`: That checks that the given entity is valid or not (in this case the datasource settings).
 - `MutateAdmission`: That allows to mutate the entity before storing it.

In [our example](https://github.com/grafana/grafana-plugin-examples/pull/401), both functions are interchangeable since both execute the same code (only validation, nothing is mutated).
