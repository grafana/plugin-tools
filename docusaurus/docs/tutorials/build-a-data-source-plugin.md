---
id: build-a-data-source-plugin
title: Build a data source plugin
sidebar_position: 1
description: Create a plugin to add support for your own data sources.
keywords:
  - grafana
  - plugins
  - plugin
  - data source
  - datasource
---

import CreatePlugin from '@shared/create-plugin-frontend.md';
import PluginAnatomy from '@shared/plugin-anatomy.md';

## Introduction

Grafana supports a wide range of [data sources](https://grafana.com/grafana/plugins/data-source-plugins/), including Prometheus, MySQL, and Datadog. In some cases, though, you already have an in-house metrics solution that you’d like to add to your Grafana dashboards. This tutorial teaches you to build a new data source plugin to query data.

In this tutorial, you'll:

- Build a data source to visualize a sine wave
- Construct queries using the query editor
- Configure your data source using the config editor

### Prerequisites

- Grafana v9.0 or later
- [LTS](https://nodejs.dev/en/about/releases/) version of Node.js

## Create a new plugin

<CreatePlugin pluginType="datasource" />

To learn how to create a backend data source plugin, see [Build a data source backend plugin](./build-a-data-source-backend-plugin.md)

## Anatomy of a plugin

<PluginAnatomy />

## Data source plugins

A data source in Grafana must extend the `DataSourceApi` interface, which requires you to define two methods: `query` and `testDatasource`.

### The `query` method

The `query` method is the heart of any data source plugin. It accepts a query from the user, retrieves the data from an external database, and returns the data in a format that Grafana recognizes.

```ts
async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse>
```

The `options` object contains the queries, or _targets_, that the user made, along with context information, like the current time interval. Use this information to query an external database.

### Test your data source

`testDatasource` implements a health check for your data source. For example, Grafana calls this method whenever the user clicks the **Save & Test** button, after changing the connection settings.

```ts
async testDatasource()
```

For an example of a health check in a frontend data source, see our [datasource-http](https://github.com/grafana/grafana-plugin-examples/blob/edf9f0259d28bc14aaaac4204058f7caab99d6ab/examples/datasource-http/src/DataSource.ts#L84) plugin.

## Returning Data frames

There are countless different databases, each with their own ways of querying data. To be able to support all the different data formats, Grafana consolidates the data into a unified data structure called [data frames](../introduction/data-frames.md).

Let's see how to create and return a data frame from the `query` method. In this step, you'll change the code in the starter plugin to return a [sine wave](https://en.wikipedia.org/wiki/Sine_wave).

1. In the current `query` method, remove the code inside the `map` function.

   The `query` method now look like this:

   ```ts title="src/datasource.ts"
   async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
     const { range } = options;
     const from = range!.from.valueOf();
     const to = range!.to.valueOf();

     const data = options.targets.map(target => {
       // Your code goes here.
     });

     return { data };
   }
   ```

1. In the `map` function, use the `lodash/defaults` package to set default values for query properties that haven't been set:

   ```ts title="src/datasource.ts"
   import defaults from 'lodash/defaults';

   const query = defaults(target, defaultQuery);
   ```

1. Create a default query at the top of datasource.ts:

   ```ts title="src/datasource.ts"
   export const defaultQuery: Partial<MyQuery> = {
     constant: 6.5,
   };
   ```

1. Create a data frame with a time field and a number field:

   ```ts title="src/datasource.ts"
   const frame = new MutableDataFrame({
     refId: query.refId,
     fields: [
       { name: 'time', type: FieldType.time },
       { name: 'value', type: FieldType.number },
     ],
   });
   ```

   `refId` needs to be set to tell Grafana which query that generated this date frame.

Next, we'll add the actual values to the data frame. Don't worry about the math used to calculate the values.

1. Create a couple of helper variables:

   ```ts title="src/datasource.ts"
   // duration of the time range, in milliseconds.
   const duration = to - from;

   // step determines how close in time (ms) the points will be to each other.
   const step = duration / 1000;
   ```

1. Add the values to the data frame:

   ```ts title="src/datasource.ts"
   for (let t = 0; t < duration; t += step) {
     frame.add({ time: from + t, value: Math.sin((2 * Math.PI * t) / duration) });
   }
   ```

   The `frame.add()` accepts an object where the keys corresponds to the name of each field in the data frame.

1. Return the data frame:

   ```ts title="src/datasource.ts"
   return frame;
   ```

1. Try it out by creating a new data source instance and building a dashboard.

Your data source is now sending data frames that Grafana can visualize. Next, we'll look at how you can control the frequency of the sine wave by defining a _query_.

:::info
In this example, we're generating timestamps from the current time range. This means that you'll get the same graph no matter what time range you're using. In practice, you'd instead use the timestamps returned by your database.
:::

## Define a query

Most data sources offer a way to query specific data. MySQL and PostgreSQL use SQL, while Prometheus has its own query language, called _PromQL_. No matter what query language your databases are using, Grafana lets you build support for it.

Add support for custom queries to your data source, by implementing your own _query editor_, a React component that enables users to build their own queries, through a user-friendly graphical interface.

A query editor can be as simple as a text field where the user edits the raw query text, or it can provide a more user-friendly form with drop-down menus and switches, that later gets converted into the raw query text before it gets sent off to the database.

### Define the query model

The first step in designing your query editor is to define its _query model_. The query model defines the user input to your data source.

We want to be able to control the frequency of the sine wave, so let's add another property.

1. Add a new number property called `frequency` to the query model:

   ```ts title="src/types.ts"
   export interface MyQuery extends DataQuery {
     queryText?: string;
     constant: number;
     frequency: number;
   }
   ```

1. Set a default value to the new `frequency` property:

   ```ts title="src/types.ts"
   export const defaultQuery: Partial<MyQuery> = {
     constant: 6.5,
     frequency: 1.0,
   };
   ```

### Bind the model to a form

Now that you've defined the query model you wish to support, the next step is to bind the model to a form. The `FormField` is a text field component from `grafana/ui` that lets you register a listener which will be invoked whenever the form field value changes.

1. Define the `frequency` from the `query` object and add a new form field to the query editor to control the new frequency property in the `render` method.

   ```tsx title="src/components/QueryEditor.tsx"
   const { queryText, constant, frequency } = query;

   <InlineField label="Frequency" labelWidth={16}>
     <Input onChange={onFrequencyChange} value={frequency || ''} />
   </InlineField>;
   ```

1. Add a event listener for the new property.

   ```tsx title="src/components/QueryEditor.tsx"
   const onFrequencyChange = (event: ChangeEvent<HTMLInputElement>) => {
     onChange({ ...query, frequency: parseFloat(event.target.value) });
     // executes the query
     onRunQuery();
   };
   ```

   The registered listener, `onFrequencyChange`, calls `onChange` to update the current query with the value from the form field.

   `onRunQuery();` tells Grafana to run the query after each change. For fast queries, this is recommended to provide a more responsive experience.

### Use the property

The new query model is now ready to use in our `query` method.

1. In the `query` method, use the `frequency` property to adjust our equation.

   ```ts title="src/datasource.ts"
   frame.add({ time: from + t, value: Math.sin((2 * Math.PI * query.frequency * t) / duration) });
   ```

1. Try it out by changing the frequency in the query for your panel.

## Enable configuration for your datasource

To access a specific data source, you often need to configure things like hostname, credentials, or authentication method. A _config editor_ lets your users configure your data source plugin to fit their needs.

The config editor looks similar to the query editor, in that it defines a model and binds it to a form.

Since we're not actually connecting to an external database in our sine wave example, we don't really need many options. To show you how you can add an option however, we're going to add the _wave resolution_ as an option.

The resolution controls how close in time the data points are to each other. A higher resolution means more points closer together, at the cost of more data being processed.

### Define the options model

1. Add a new number property called `resolution` to the options model.

   ```ts title="src/types.ts"
   export interface MyDataSourceOptions extends DataSourceJsonData {
     path?: string;
     resolution?: number;
   }
   ```

### Bind the model to a form

Just like query editor, the form field in the config editor calls the registered listener whenever the value changes.

1. Add a new form field to the query editor to control the new resolution option.

   ```tsx title="src/components/ConfigEditor.tsx"
   <InlineField label="Resolution" labelWidth={12}>
     <Input onChange={onResolutionChange} value={jsonData.resolution || ''} placeholder="Enter a number" width={40} />
   </InlineField>
   ```

1. Add a event listener for the new option.

   ```ts title="src/components/ConfigEditor.tsx"
   const onResolutionChange = (event: ChangeEvent<HTMLInputElement>) => {
     const jsonData = {
       ...options.jsonData,
       resolution: parseFloat(event.target.value),
     };
     onOptionsChange({ ...options, jsonData });
   };
   ```

   The `onResolutionChange` listener calls `onOptionsChange` to update the current options with the value from the form field.

### Use the option

1. Create a property called `resolution` to the `DataSource` class.

   ```ts title="src/datasource.ts"
   export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
     resolution: number;

     constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
       super(instanceSettings);

       this.resolution = instanceSettings.jsonData.resolution || 1000.0;
     }

     // ...
   ```

1. In the `query` method, use the `resolution` property to change how we calculate the step size.

   ```ts title="src/datasource.ts"
   const step = duration / this.resolution;
   ```

1. Try it out by configuring a new datasource and changing the value for the resolution.

## Summary

In this tutorial you built a complete data source plugin for Grafana that uses a query editor to control what data to visualize. You've added a data source option, commonly used to set connection options and more.

## Learn more

### Get data from an external API

The majority of data sources in Grafana will return data from an external API. This tutorial tries to keep things simple and doesn't require an additional service. To see how this can be achieved, use the [datasource-http](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/datasource-http) sample.

This sample shows the use of the [`getBackendSrv` function](https://github.com/grafana/grafana/blob/main/packages/grafana-runtime/src/services/backendSrv.ts) from the [`grafana-runtime` package](https://github.com/grafana/grafana/tree/main/packages/grafana-runtime).

While you can use something like [axios](https://github.com/axios/axios) or the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to make requests, we recommend using `getBackendSrv` as it proxies requests through the Grafana server rather making the request from the browser. We strongly recommend this when making authenticated requests to an external API. For more information on authenticating external requests, refer to [Add authentication for data source plugins](../create-a-plugin/extend-a-plugin/add-authentication-for-data-source-plugins.md).

### Improving your plugin's quality

To learn more about advanced plugin development topics, refer to the following:

- [Add support for variables](../create-a-plugin/extend-a-plugin/add-support-for-variables.md)
- [Add support for annotations](../create-a-plugin/extend-a-plugin/enable-annotations.md)
- [Add support for Explore queries](../create-a-plugin/extend-a-plugin/add-support-for-explore-queries.md)
- [Build a logs data source](./build-a-logs-data-source-plugin.md)
