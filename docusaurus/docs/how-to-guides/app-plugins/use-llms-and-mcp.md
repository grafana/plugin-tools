---
id: use-llms-and-mcp
title: Use LLMs and Grafana MCP in Grafana app plugins
description: How to use Large Language Models (LLMs) and the Grafana Model Context Protocol server in plugins.
keywords:
  - grafana
  - plugin
  - app
  - llm
  - mcp
  - ai
  - agent
---

# Use LLMs and Grafana MCP in Grafana app plugins

This guide shows how to use Large Language Models (LLMs) and the Grafana [Model Context Protocol][mcp] (MCP) server in plugins.

Grafana admins can install the [Grafana LLM app] plugin to centralise access to LLMs in Grafana. Plugin authors can make use of the [`@grafana/llm`][npm] npm package to make secure requests to the configured LLM via the Grafana plugin backend.

The Grafana LLM app also provides access to the Grafana MCP server. This provides useful MCP tools which can be included in requests to LLMs and called via standard MCP client libraries.

## Use LLMs in Grafana app plugins

To use LLMs in Grafana app plugins, you can use the [`@grafana/llm`][npm] npm package. This package provides a simple interface to make secure requests to the configured LLM via the Grafana plugin backend.

Here's an example of how to use the package:

```typescript
import { llm } from '@grafana/llm';

// Check whether the LLM plugin is installed, enabled and configured.
const enabled = await llm.enabled();
if (!enabled) {
  console.log('LLM plugin is not enabled');
  return;
}

// Construct your messages to send to the LLM.
const messages: llm.Message[] = [
  { role: 'system', content: 'You are an experienced, competent SRE with knowledge of PromQL, LogQL and Grafana.' },
  { role: 'user', content: 'What metric should I use to monitor CPU usage of a container?' },
];

// Make a single request to the LLM.
const response = await llm.chatCompletions({
  model: llm.Model.BASE,
  messages,
});

/// Use the response in your plugin's UI.
console.log(response.choices[0].message.content);
```

You can also make 'streaming' requests to the LLM, which will return a stream of responses as they are generated. This can be useful for showing real-time LLM responses in your plugin's UI.

```typescript
import { llm } from '@grafana/llm';

// Check whether the LLM plugin is installed, enabled and configured.
const enabled = await llm.enabled();
if (!enabled) {
  console.log('LLM plugin is not enabled');
  return;
}

// Construct your messages to send to the LLM.
const messages: llm.Message[] = [
  { role: 'system', content: 'You are an experienced, competent SRE with knowledge of PromQL, LogQL and Grafana.' },
  { role: 'user', content: 'What metric should I use to monitor CPU usage of a container?' },
];

// Make a streaming request to the LLM.
// The return value is an rxjs `Observable` of chunks of the response.
const stream = await llm.streamChatCompletions({
  model: llm.Model.BASE,
  messages,
});

// Use the helper function to accumulate the content into a single string,
// logging each accumulated string to the console.
stream.pipe(llm.accumulateContent()).subscribe(console.log);
```

## Use the Grafana MCP server in app plugins

Since version 0.22, the [`@grafana/llm`][npm] package also provides a simple interface to make requests to the Grafana MCP server. The tools in the MCP server can be passed to the LLM, and the LLM can choose to call the tools as part of an ongoing, agent-like conversation. This also requires the Grafana LLM app plugin >= 0.22 to be installed and enabled on the Grafana instance.

Here's an example of how to use the package:

```typescript
import { llm, mcp } from '@grafana/llm';

// Check whether the LLM plugin is installed, enabled and configured.
const enabled = await llm.enabled();
if (!enabled) {
  console.log('LLM plugin is not enabled');
  return;
}

// Check whether the MCP plugin is installed, enabled and configured.
const mcpEnabled = await mcp.enabled();
if (!mcpEnabled) {
  console.log('LLM plugin is not enabled');
  return;
}

// Connect to the MCP server over streamable HTTP.
// `mcp.Client` is a re-export of the client from `@modelcontextprotocol/sdk`.
const mcpClient = new mcp.Client({
  name: 'my app',
  version: '1.0.0',
});
// `mcp.StreamableHTTPTransport` is a re-export of the transport from `@modelcontextprotocol/sdk`.
const transport = new mcp.StreamableHTTPTransport(mcp.streamableHTTPUrl());
await mcpClient.connect(transport);

// Construct your messages to send to the LLM.
const messages: llm.Message[] = [
  { role: 'system', content: 'You are an experienced, competent SRE with knowledge of PromQL, LogQL and Grafana.' },
  { role: 'user', content: 'What metric should I use to monitor CPU usage of a container?' },
];

// List tools available in the MCP server.
const tools = await mcpClient.listTools();

// Make a single request to the LLM.
const response = await llm.chatCompletions({
  model: llm.Model.BASE,
  messages,
  tools: mcp.convertToolsToOpenAI(tools),
});

// Handle function calls from the LLM. This is where you would include an agent-like loop to
// call the tools using `mcpClient.callTool`. This is outside the scope of this guide.
```

### Accessing the MCP client from React components

You can use the `mcp.MCPClientProvider` component and the `useMCPClient` hook to access the MCP client from React components.
This is helpful to avoid some boilerplate code required to check whether the MCP plugin is installed, enabled and configured,
and to connect and initialize the MCP client:

```tsx
import React, { Suspense } from 'react';
import { mcp } from '@grafana/llm';
import { ErrorBoundary } from '@grafana/ui';
import { useAsync } from 'react-use';

function Component() {
  // Use the `useMCPClient` hook to access the MCP client.
  const mcpClient = mcp.useMCPClient();
  const { loading, error, value: tools } = useAsync(() => client.listTools());

  if (loading) {
    return <Spinner />;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  const t = tools?.tools ?? [];
  return (
    <div>
      {tools.map(
        (i, tool) => <div key={i}>{tool.name}</div>
      )}
    </div>
  );
}

function App() {
  // Wrap our component in the `MCPClientProvider` component to provide the MCP client to all children.
  // This can be further wrapped in a `Suspense` component to show a loading state while the
  // MCP client is being initialized.
  return (
    <Suspense fallback={<Spinner />}>
      <ErrorBoundary>
        {({ error }) => {
          if (error) {
            return <div>Error with MCP: {error.message}</div>;
          }
          return (
            <mcp.MCPClientProvider
              appName="my-app"
              appVersion="1.0.0"
            >
              <Component />
            </mcp.MCPClientProvider>
          )
        }}
      </ErrorBoundary>
    </Suspense>
  )
}
```

[mcp]: https://modelcontextprotocol.io/
[Grafana LLM app]: https://grafana.com/grafana/plugins/grafana-llm-app/
[npm]: https://www.npmjs.com/package/@grafana/llm
