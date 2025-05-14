---
id: datasources-with-streaming-support
title: Add streaming support to your data source
description: How to add streaming support to your data source
keywords:
  - grafana
  - plugins
  - plugin
  - cookbook
  - data source
---

# Add websockets streaming support to your data source

## The Problem

Grafana excels at visualizing data, but many use cases require real-time updates without manual refreshing. How can we create a Grafana data source plugin that continuously streams data from a WebSocket connection and updates visualizations in real-time?

## Base Example

The simplest solution is to implement a data source plugin that establishes a WebSocket connection and uses Grafana's streaming capabilities to update panels as new data arrives. Here's a minimal implementation:

```typescript title="datasource.ts"
query(options: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
  return new Observable<DataQueryResponse>((subscriber) => {
    // Create a data frame for streaming data
    const frame = new CircularDataFrame({
      append: 'tail',
      capacity: 1000,
    });

    frame.addField({ name: 'time', type: FieldType.time });
    frame.addField({ name: 'value', type: FieldType.number });

    // Connect to WebSocket
    const ws = new WebSocket('ws://your-server:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      frame.add(data);

      subscriber.next({
        data: [frame],
        state: LoadingState.Streaming,
      });
    };

    // Clean up on unsubscribe
    return () => ws.close();
  });
}
```

This code creates a streaming data source that connects to a WebSocket server, processes incoming messages, and continuously updates visualizations.

## Details about `CircularDataFrame`

Grafana's `CircularDataFrame` is specifically designed for streaming data scenarios:

When dealing with real-time data, you need a way to limit memory usage while maintaining a continuous view of recent data. The CircularDataFrame automatically removes old data points when it reaches capacity, creating a "sliding window" of data.

### Proper WebSocket Connection Management

Properly managing the WebSocket connection lifecycle is crucial:

1. **Establish connections when needed**: Create the connection when the query starts, not in the constructor
2. **Handle errors gracefully**: Always implement error handling for WebSocket connections
3. **Clean up resources**: Always close the connection when the subscription ends

```typescript title="datasource.ts"
// ❌ BAD: No error handling or cleanup
const ws = new WebSocket(url);
ws.onmessage = (event) => {
  // Process data...
};
```

```typescript title="datasource.ts"
// ✅ GOOD: Complete lifecycle management
const ws = new WebSocket(url);

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  subscriber.error(error);
};

ws.onmessage = (event) => {
  // Process data...
};

// Clean up
return () => {
  ws.close();
};
```

### Signaling Streaming State

To ensure Grafana knows your data source is streaming:

> Always set the state to `LoadingState.Streaming` when emitting data frames. This tells Grafana to keep the visualization updated continuously.

```typescript title="datasource.ts"
subscriber.next({
  data: [frame],
  key: frame.refId,
  state: LoadingState.Streaming,
});
```
