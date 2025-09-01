---
id: build-a-data-source-backend-plugin
title: Build a data source plugin backend component
sidebar_position: 10
description: Learn how to create a backend for your data source plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - backend
  - backend data source
  - datasource
---

import CreatePlugin from '@shared/create-plugin-backend.md';
import BackendPluginAnatomy from '@shared/backend-plugin-anatomy.md';
import TroubleshootPluginLoad from '@shared/troubleshoot-plugin-doesnt-load.md';

## Introduction

Grafana supports a wide range of [data sources](https://grafana.com/grafana/plugins/data-source-plugins/), including Prometheus, MySQL, and Datadog. In some cases, though, you already have an in-house metrics solution that you’d like to add to your Grafana dashboards. This tutorial teaches you to build a new data source plugin to query data.

A backend component provides a number of additional capabilities to your plugin, such as custom authentication methods. Learn more in [key concepts of a plugin backend component](../key-concepts/backend-plugins/).

In this tutorial, you'll:

- Build a [backend](../key-concepts/backend-plugins/) for your data source
- Implement a health check for your data source
- Enable [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/) for your data source

#### Prerequisites

- Grafana v10.0 or later
- [Docker](https://docs.docker.com/get-docker/)
- Go ([Version](https://github.com/grafana/plugin-tools/blob/main/packages/create-plugin/templates/backend/go.mod#L3))
- [Mage](https://magefile.org/)
- [LTS](https://nodejs.dev/en/about/releases/) version of Node.js

## Create a new plugin

<CreatePlugin />

Now, let's verify that the plugin you've built so far can be used in Grafana when creating a new data source:

1. On the side menu, go to **Connections** > **Data Sources**.
1. Click **Add data source**.
1. Search for the name of your newly created plugin and select it.
1. Enter a name and then click **Save & Test**. If a "randomized error" occurs, you may ignore it - this is a result of the [health check](#add-support-for-health-checks) explained further below.

You now have a new data source instance of your plugin that is ready to use in a dashboard.

To add the data source to the dashboard:

1. Create a new dashboard and add a new panel.
1. On the query tab, select the data source you just created. A line graph is rendered with one series consisting of two data points.
1. Save the dashboard.

### Troubleshooting

<TroubleshootPluginLoad />

## Anatomy of a plugin backend component

<BackendPluginAnatomy pluginType="data source" />

In the next step we will look at the query endpoint!

## Implement data queries

We begin by opening the file `/pkg/plugin/datasource.go`. In this file you will see the `Datasource` struct which implements the [backend.QueryDataHandler](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend?tab=doc#QueryDataHandler) interface. The `QueryData` method on this struct is where the data fetching happens for a data source plugin.

Each request contains multiple queries to reduce traffic between Grafana and plugins. So you need to loop over the slice of queries, process each query, and then return the results of all queries.

In the tutorial we have extracted a method named `query` to take care of each query model. Since each plugin has their own unique query model, Grafana sends it to the plugin backend as JSON. Therefore the plugin needs to `Unmarshal` the query model into something easier to work with.

As you can see the sample only returns static numbers. Try to extend the plugin to return other types of data.

For example to generate three floats equally spaced in time, you can replace the two static numbers generated, using the following code:

```go
duration := query.TimeRange.To.Sub(query.TimeRange.From)
mid := query.TimeRange.From.Add(duration / 2)

s := rand.NewSource(time.Now().UnixNano())
r := rand.New(s)

lowVal := 10.0
highVal := 20.0
midVal := lowVal + (r.Float64() * (highVal - lowVal))

// add fields.
frame.Fields = append(frame.Fields,
  data.NewField("time", nil, []time.Time{query.TimeRange.From, mid, query.TimeRange.To}),
  data.NewField("values", nil, []float64{lowVal, midVal, highVal}),
)
```

You can read more about how to [build data frames in our docs](../key-concepts/data-frames).

## Add support for health checks

Implementing the health check handler allows Grafana to verify that a data source has been configured correctly.

When editing a data source in Grafana's UI, you can **Save & Test** to verify that it works as expected.

In this sample data source, there is a 50% chance that the health check will be successful. Make sure to return appropriate error messages to the users, informing them about what is misconfigured in the data source.

Open `/pkg/plugin/datasource.go`. In this file, you'll see that the `Datasource` struct also implements the [backend.CheckHealthHandler](https://pkg.go.dev/github.com/grafana/grafana-plugin-sdk-go/backend?tab=doc#CheckHealthHandler) interface. Go to the `CheckHealth` method to see how the health check for this sample plugin is implemented.

## Add authentication

Implementing authentication allows your plugin to access protected resources like databases or APIs. To learn more, see [How to authenticate using a plugin backend component](../how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins#authenticate-using-a-plugin-backend).

## Enable Grafana Alerting

1. Add the top level `alerting` property with a value of `true` to specify that your plugin supports Grafana Alerting, e.g.

   ```json title="src/plugin.json"
   {
     ...
     "backend": true,
     "executable": "gpx_simple_datasource_backend",
     "alerting": true,
     "info": {
     ...
   }
   ```

1. Restart your Grafana instance.
1. Open Grafana in your web browser.
1. Verify that alerting is now supported by navigating to your created data source. You should see an "Alerting supported" message in the Settings view.

### Create an alert

:::note

The following instructions are based on Grafana v10.1.1, consult the [documentation](https://grafana.com/docs/grafana/latest/alerting/) for alerting for version appropriate guidance.

:::

1. Open the dashboard you created earlier in the _Create a new plugin_ step.
1. Edit the existing panel.
1. Click on the _Alert_ tab underneath the panel.
1. Click on _Create alert rule from this panel_ button.
1. In _Expressions_ section, in the _Threshold_ expression `C`, set the _IS ABOVE_ to `15`.
1. Click on _Set as alert condition_ on _Threshold_ expression `C`. Your alert should now look as follows.
   ![Expression section showing B "reduce" with Input: A, Function: Last, Mode: Strict, C Threshold with Input: B, Is Above: 15 and Alert Condition enabled indicator](/img/create-alert.png 'Alert Expression')
1. In _Set alert evaluation behavior_ section, click on _New folder_ button and create a new folder to store an evaluation rule.
1. Then, click on _New evaluation group_ button and create a new evaluation group; choose a name and set the _Evaluation interval_ to `10s`.
1. Click _Save rule and exit_ button.
1. Save the dashboard. After some time, the alert rule evaluates and transitions into the _Alerting_ state.

## Run multiple queries concurrently

:::note

This feature is only available for the Grafana plugin backend SDK version 0.232.0 and later.

:::

By default, multiple queries within a single request (that is, within one panel) are executed sequentially. To run multiple queries concurrently, you can use the `concurrent.QueryData` function that the SDK exposes.

To use `concurrent.QueryData`, specify how to execute a single query and a limit on the number of concurrent queries to run. Note that the maximum is 10 concurrent queries.

```go
import (
	...
	"github.com/grafana/grafana-plugin-sdk-go/experimental/concurrent"
	...
)

func (d *Datasource) handleSingleQueryData(ctx context.Context, q concurrent.Query) (res backend.DataResponse) {
  // Implement the query logic here
}

func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return concurrent.QueryData(ctx, req, d.handleSingleQueryData, 10)
}
```

## Summary

In this tutorial you created a backend for your data source plugin.
