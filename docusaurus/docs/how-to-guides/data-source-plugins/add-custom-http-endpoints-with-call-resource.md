---
id: add-custom-http-endpoints-with-call-resource
title: Extending Grafana Data Source Plugins with Custom HTTP Endpoints using CallResource
description: Learn how to add Custom HTTP Endpoints using CallResource
keywords:
  - grafana
  - plugins
  - data source
  - CallResource
  - resource
  - custom endpoint
  - transformation
  - proxy
  - authentication
  - authorization
---

# Extending Grafana Data Source Plugins with Custom HTTP Endpoints using CallResource

The CallResource function is a powerful feature in Grafana data source plugins that allows you to handle custom HTTP endpoints.
This can be particularly useful for extending the functionality of your data source plugin by providing additional API endpoints for various purposes.

## What is CallResource?

CallResource is a method that you can implement in your Grafana data source plugin to handle custom HTTP requests.
This method is part of the backend.CallResourceHandler interface. When Grafana receives an HTTP request to a custom endpoint defined in your plugin,
it will invoke the CallResource method, allowing you to process the request and return a response.

## Common Use Cases

1. Custom API Endpoints: You can create custom API endpoints to perform specific actions or retrieve additional data that is not directly related to querying the primary data source.
1. Data Transformation: Use CallResource to perform server-side data transformations before sending the data back to the Grafana frontend.
1. Authentication and Authorization: Implement custom authentication and authorization logic for specific endpoints.
1. Proxying Requests: Forward requests to another service or API, acting as a proxy.

## Example Implementations

Below are distinct examples for each of the common use cases identified.

1. Custom API Endpoints

```go
func (ds *MyDataSource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    switch req.Path {
    case "custom-endpoint":
        return ds.handleCustomEndpoint(ctx, req, sender)
    default:
        return backend.ErrResourceNotFound
    }
}

func (ds *MyDataSource) handleCustomEndpoint(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    responseData := map[string]interface{}{
        "message": "This is a custom API endpoint",
    }

    responseBody, err := json.Marshal(responseData)
    if err != nil {
        return sender.Send(http.StatusInternalServerError, nil)
    }

    return sender.Send(http.StatusOK, responseBody)
}
```

1. Data Transformation

```go
func (ds *MyDataSource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    switch req.Path {
    case "transform-data":
        return ds.handleDataTransformation(ctx, req, sender)
    default:
        return backend.ErrResourceNotFound
    }
}

func (ds *MyDataSource) handleDataTransformation(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    var requestData map[string]interface{}
    if err := json.Unmarshal(req.Body, &requestData); err != nil {
        return sender.Send(http.StatusBadRequest, nil)
    }

    // Perform data transformation
    transformedData := map[string]interface{}{
        "transformed": requestData,
    }

    responseBody, err := json.Marshal(transformedData)
    if err != nil {
        return sender.Send(http.StatusInternalServerError, nil)
    }

    return sender.Send(http.StatusOK, responseBody)
}
```

1. Authentication and Authorization

```go
func (ds *MyDataSource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    switch req.Path {
    case "secure-endpoint":
        return ds.handleSecureEndpoint(ctx, req, sender)
    default:
        return backend.ErrResourceNotFound
    }
}

func (ds *MyDataSource) handleSecureEndpoint(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    // Example: Check for an API key in the request headers
    apiKey := req.Headers.Get("X-API-Key")
    if apiKey != "expected-api-key" {
        return sender.Send(http.StatusUnauthorized, nil)
	}

    responseData := map[string]interface{}{
        "message": "Authorized access",
    }

    responseBody, err := json.Marshal(responseData)
    if err != nil {
        return sender.Send(http.StatusInternalServerError, nil)
    }

    return sender.Send(http.StatusOK, responseBody)
}
```

1. Proxying Requests

```go
func (ds *MyDataSource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    switch req.Path {
    case "proxy-endpoint":
        return ds.handleProxyRequest(ctx, req, sender)
    default:
        return backend.ErrResourceNotFound
    }
}

func (ds *MyDataSource) handleProxyRequest(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
    // Example: Forward the request to another service
    proxyURL := "https://api.example.com/data"
    resp, err := http.Get(proxyURL)
    if err != nil {
        return sender.Send(http.StatusInternalServerError, nil)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return sender.Send(http.StatusInternalServerError, nil)
    }

    return sender.Send(resp.StatusCode, body)
}
```

## Conclusion

The CallResource function in Grafana data source plugins provides a flexible way to handle custom HTTP requests.
By implementing this function, you can extend your plugin's capabilities to include custom API endpoints, data transformations,
authentication and authorization, and proxying requests. This tutorial covered distinct examples for each of these use cases to help you get started.
