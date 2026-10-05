---
id: use-feature-flags-in-backend-plugins
title: Use feature flags in backend plugins
description: Evaluate OpenFeature feature flags in a plugin backend against the endpoint that Grafana advertises.
keywords:
  - grafana
  - plugins
  - plugin
  - backend
  - feature flags
  - feature toggles
  - openfeature
  - ofrep
---

# Use feature flags in backend plugins

Grafana tells your plugin backend which [OpenFeature](https://openfeature.dev/) endpoint to use for feature flags. Your plugin can then evaluate its own flags against that endpoint over the [OpenFeature Remote Evaluation Protocol (OFREP)](https://openfeature.dev/specification/appendix-c). This lets you ship a change turned off, and turn it on later without another plugin release.

:::note

`FeatureToggles().IsEnabled()` only reports which boolean Grafana feature toggles are on. OpenFeature also evaluates string, number, and object flags, and flags that a remote provider manages.

:::

## Before you begin

- Use version vX.Y.Z or later of the [Grafana plugin SDK for Go](https://github.com/grafana/grafana-plugin-sdk-go).
- Run your plugin in Grafana X.Y or later. Earlier versions don't advertise an endpoint.
- Add an OFREP provider for the OpenFeature Go SDK to your plugin, such as [`github.com/open-feature/go-sdk-contrib/providers/ofrep`](https://github.com/open-feature/go-sdk-contrib/tree/main/providers/ofrep).

## How Grafana advertises an endpoint

Grafana adds the endpoint details to the configuration of every request that it sends to your plugin backend. Call `OpenFeature()` on the Grafana configuration to read them:

```go
of, err := config.GrafanaConfigFromContext(ctx).OpenFeature()
```

The returned `OpenFeatureConfig` has these fields:

| Field          | Description                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `URL`          | The base URL of the OFREP service. OFREP clients append `/ofrep/v1/evaluate/flags` to it.                                                                                                                                   |
| `ProviderType` | The kind of endpoint that `URL` points at, such as `static` (Grafana serves its own flags), `features-service`, or `ofrep`. Later Grafana versions can send other values, so don't reject a value that you don't recognize. |
| `CacheTTL`     | How long Grafana suggests that you cache an evaluation result. `0` means that Grafana gives no advice.                                                                                                                      |
| `ContextAttrs` | Evaluation context attributes that Grafana sets, such as `grafana_version`. Add them to your evaluation context unchanged.                                                                                                  |

What Grafana advertises depends on its configuration:

- If Grafana Cloud sets a separate OFREP endpoint for plugins, Grafana advertises that endpoint with the type `ofrep`.
- Otherwise, with the `static` provider, which is the default, Grafana advertises its own URL. Grafana serves the flags from the `[feature_toggles]` section of its configuration file.
- Otherwise, with a remote provider, `features-service` or `ofrep`, Grafana advertises the URL of that provider.
- In all other cases, Grafana advertises nothing. `OpenFeature()` then returns an error that wraps `config.ErrOpenFeatureNotConfigured`.

Grafana only adds this configuration to requests. Your plugin can't read it at startup, so create the provider when the first request arrives.

## Evaluate a flag

The following example evaluates a boolean flag. It creates the OFREP provider on the first request. It returns the default value when Grafana advertises no endpoint or when the evaluation fails.

```go
package plugin

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/config"
	"github.com/open-feature/go-sdk-contrib/providers/ofrep"
	"github.com/open-feature/go-sdk/openfeature"
)

// flagDomain keeps the plugin's provider separate from other OpenFeature providers in the process.
const flagDomain = "myorg-myplugin-datasource"

var (
	setProviderOnce sync.Once
	flagClient      = openfeature.NewClient(flagDomain)
)

// isEnabled evaluates a boolean flag against the endpoint that Grafana advertises.
// It returns defaultValue when Grafana advertises no endpoint or the evaluation fails.
func isEnabled(ctx context.Context, flag string, defaultValue bool) bool {
	logger := log.DefaultLogger.FromContext(ctx)

	of, err := config.GrafanaConfigFromContext(ctx).OpenFeature()
	if err != nil {
		if !errors.Is(err, config.ErrOpenFeatureNotConfigured) {
			logger.Warn("Invalid OpenFeature configuration from Grafana", "error", err)
		}
		return defaultValue
	}

	setProviderOnce.Do(func() {
		provider := ofrep.NewProvider(of.URL, ofrep.WithTimeout(5*time.Second))
		if err := openfeature.SetNamedProviderWithContextAndWait(ctx, flagDomain, provider); err != nil {
			logger.Warn("Failed to set the OpenFeature provider", "error", err)
		}
	})

	namespace := backend.PluginConfigFromContext(ctx).Namespace
	if namespace == "" {
		namespace = of.ContextAttrs["namespace"]
	}
	attrs := map[string]any{"namespace": namespace}
	for k, v := range of.ContextAttrs {
		attrs[k] = v
	}

	value, err := flagClient.BooleanValue(ctx, flag, defaultValue, openfeature.NewEvaluationContext(namespace, attrs))
	if err != nil {
		logger.Debug("Feature flag evaluation failed", "flag", flag, "error", err)
	}
	return value
}
```

The SDK adds the Grafana configuration and the plugin context to the context of every request, so you can call `isEnabled` from any handler:

```go
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	if isEnabled(ctx, "myorg-myplugin-datasource.new-parser", false) {
		return d.queryWithNewParser(ctx, req)
	}
	return d.query(ctx, req)
}
```

For other flag types, use `StringValue`, `IntValue`, `FloatValue`, or `ObjectValue` on the same client.

### Build the evaluation context

The example builds the evaluation context from two sources:

- The namespace of the request, from `PluginContext.Namespace`. It's the targeting key. If it's empty, the example uses the `namespace` attribute that Grafana sends.
- The `ContextAttrs` that Grafana advertises. The example adds them last, so they replace any attribute with the same name. Targeting rules can depend on any of these attributes, so don't drop or override them.

### Cache evaluation results

The OFREP provider sends one HTTP request for each evaluation. If your plugin evaluates a flag on every query, cache the result for the `CacheTTL` that Grafana advertises. Cache failed evaluations too, so that an unreachable endpoint costs one request for each TTL. Use the flag key and the targeting key as the cache key, because a flag can have a different value in each namespace.

## Test a flag locally

With the `static` provider, add your flag to the `[feature_toggles]` section of the Grafana configuration file:

```ini
[feature_toggles]
myorg-myplugin-datasource.new-parser = true
```

A flag value can also be a string, a number, or a JSON object. Restart Grafana after you change the file, because the `static` provider reads it at startup.

Use a flag key that starts with your plugin ID, so that it can't collide with a Grafana flag.
