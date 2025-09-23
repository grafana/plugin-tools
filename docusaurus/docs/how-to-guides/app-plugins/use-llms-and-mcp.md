---
id: use-llms-and-mcp
title: Use LLMs and Grafana MCP in Grafana app plugins
description: Learn how to integrate Large Language Models (LLMs) and the Grafana Model Context Protocol server into your Grafana app plugins for AI-powered functionality.
keywords:
  - grafana
  - plugin development
  - app plugin
  - llm
  - large language model
  - mcp
  - model context protocol
  - ai
  - artificial intelligence
  - agent
---

# Use LLMs and Grafana MCP in Grafana app plugins

This guide shows you how to integrate Large Language Models (LLMs) and the Grafana [Model Context Protocol][mcp] (MCP) server into your Grafana app plugins to add AI-powered functionality.

## Prerequisites

Before you begin, ensure you have:

- The [Grafana LLM app] plugin installed and enabled (version 0.22 or later for MCP features)
- A [Grafana app plugin development environment][app-plugin-dev] set up
- Basic knowledge of TypeScript and React
- An LLM provider configured in your Grafana instance
- Node.js and npm installed for package management

## About LLMs and MCP in Grafana plugins

Grafana admins can install the [Grafana LLM app] plugin to centralize LLM access across Grafana. As a plugin author, you can use the [`@grafana/llm`][npm] npm package to make secure requests to the configured LLM through Grafana's plugin backend.

The Grafana LLM app also provides access to the Grafana MCP server. The Model Context Protocol (MCP) provides useful tools that can be included in requests to LLMs, allowing them to perform actions and gather information as part of agent-like conversations.

## Use LLMs in your plugin

To integrate LLM functionality into your Grafana app plugin:

### 1. Install the required package

```bash
npm install @grafana/llm
```

### 2. Import the LLM module

```typescript
import { llm } from '@grafana/llm';
```

### 3. Check LLM availability and make requests

The following example demonstrates a complete function that safely requests advice from an LLM. This pattern ensures your plugin gracefully handles cases where the LLM service isn't available:

```typescript
import { llm } from '@grafana/llm';

async function getLLMResponse(): Promise<string> {
  try {
    // Always verify service availability before making requests
    // This prevents runtime errors in environments where LLM isn't configured
    const enabled = await llm.enabled();
    if (!enabled) {
      throw new Error('LLM service is not configured or enabled');
    }

    // Structure messages using the OpenAI chat completion format
    // System message defines the LLM's role and expertise
    // User message contains the actual query
    const messages: llm.Message[] = [
      {
        role: 'system',
        content: 'You are an experienced, competent SRE with knowledge of PromQL, LogQL and Grafana.'
      },
      {
        role: 'user',
        content: 'What metric should I use to monitor CPU usage of a container?'
      },
    ];

    // Send the request using the base model (most cost-effective option)
    const response = await llm.chatCompletions({
      model: llm.Model.BASE,
      messages,
    });

    // Extract and return the LLM's response text
    // Always check that choices exist and contain content
    return response.choices[0]?.message?.content || 'No response received';
  } catch (error) {
    console.error('Failed to get LLM response:', error);
    throw new Error(`LLM request failed: ${error.message}`);
  }
}
```

Your plugin now has a working LLM integration that can handle both successful responses and error cases gracefully.

### 4. Use streaming responses

Streaming responses provide a better user experience for longer LLM outputs. The following example shows how to set up streaming with proper Observable handling for React components:

```typescript
import { llm } from '@grafana/llm';
import { Observable } from 'rxjs';

async function getStreamingLLMResponse(): Promise<Observable<string>> {
  try {
    // Verify service availability first
    const enabled = await llm.enabled();
    if (!enabled) {
      throw new Error('LLM service is not configured or enabled');
    }

    // Use the same message format as non-streaming requests
    const messages: llm.Message[] = [
      {
        role: 'system',
        content: 'You are an experienced, competent SRE with knowledge of PromQL, LogQL and Grafana.'
      },
      {
        role: 'user',
        content: 'What metric should I use to monitor CPU usage of a container?'
      },
    ];

    // Create a streaming connection - returns an Observable of response chunks
    const stream = llm.streamChatCompletions({
      model: llm.Model.BASE,
      messages,
    });

    // The accumulateContent helper builds complete text from chunks
    // This is ideal for displaying progressive text updates in your UI
    const accumulatedStream = stream.pipe(llm.accumulateContent());

    // Example of how to use the stream in a React component
    accumulatedStream.subscribe({
      next: (content) => {
        // Update your component's state with the accumulated content
        console.log('Streaming content:', content);
      },
      error: (error) => {
        console.error('Streaming error:', error);
        // Handle error in your UI (show error message, retry button, etc.)
      },
      complete: () => {
        console.log('Stream complete');
        // Mark the response as complete in your UI
      }
    });

    return accumulatedStream;
  } catch (error) {
    console.error('Failed to start LLM stream:', error);
    throw new Error(`LLM streaming failed: ${error.message}`);
  }
}
```

Your plugin now supports real-time AI responses. Users will see text appear progressively, creating a more responsive experience for longer explanations or complex analyses.

## Use MCP tools with LLMs

The Model Context Protocol (MCP) allows LLMs to use tools to perform actions and gather information. This requires the Grafana LLM app plugin version 0.22 or later.

### 1. Set up MCP client

This example creates a reusable MCP client that your plugin can use throughout its lifecycle. The client manages the connection to Grafana's MCP server and provides access to observability tools:

```typescript
import { llm, mcp } from '@grafana/llm';

async function setupMCPClient(): Promise<InstanceType<typeof mcp.Client>> {
  try {
    // Verify both services are available - MCP requires the base LLM service
    const enabled = await llm.enabled();
    if (!enabled) {
      throw new Error('LLM service is not configured or enabled');
    }

    const mcpEnabled = await mcp.enabled();
    if (!mcpEnabled) {
      throw new Error('MCP service is not enabled or configured');
    }

    // Create client with your plugin's identity
    // Use your actual plugin name and version for better debugging
    const mcpClient = new mcp.Client({
      name: 'my-monitoring-plugin', // Replace with your plugin name
      version: '1.0.0',              // Replace with your plugin version
    });

    // Establish HTTP connection to Grafana's MCP server
    // The streamableHTTPURL() provides the correct endpoint automatically
    const transport = new mcp.StreamableHTTPClientTransport(mcp.streamableHTTPURL());
    await mcpClient.connect(transport);

    // Verify connection by listing available tools
    const toolsResponse = await mcpClient.listTools();
    console.log(`Connected to MCP server with ${toolsResponse.tools.length} tools available`);

    return mcpClient;
  } catch (error) {
    console.error('Failed to setup MCP client:', error);
    throw new Error(`MCP setup failed: ${error.message}`);
  }
}
```

### 2. Use MCP tools with LLM requests

To use MCP tools in combination with LLM requests, follow these steps:

This example demonstrates the complete agent pattern where an LLM can call tools and use their results to provide informed responses. This is particularly powerful for observability use cases:

```typescript
async function useMCPWithLLM(): Promise<string> {
  try {
    const mcpClient = await setupMCPClient();

    // Start with a conversation that might require tool usage
    const messages: llm.Message[] = [
      {
        role: 'system',
        content: 'You are an experienced, competent SRE with knowledge of PromQL, LogQL and Grafana. Use the available tools to gather real-time information about the system before providing recommendations.'
      },
      {
        role: 'user',
        content: 'What alerts are currently firing in my system?'
      },
    ];

    // Retrieve and convert available tools for the LLM
    const toolsResponse = await mcpClient.listTools();
    const tools = mcp.convertToolsToOpenAI(toolsResponse.tools);

    console.log(`Available tools: ${tools.map(t => t.function.name).join(', ')}`);

    // Send initial request with tools available
    let response = await llm.chatCompletions({
      model: llm.Model.BASE,
      messages,
      tools,
    });

    // Process any tool calls the LLM wants to make
    while (response.choices[0].message.tool_calls) {
      // Add the LLM's response (with tool calls) to the conversation
      messages.push(response.choices[0].message);

      // Execute each tool call the LLM requested
      for (const toolCall of response.choices[0].message.tool_calls) {
        try {
          console.log(`Executing tool: ${toolCall.function.name}`);

          const result = await mcpClient.callTool({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
          });

          // Add the tool's result back to the conversation
          messages.push({
            role: 'tool',
            content: JSON.stringify(result.content),
            tool_call_id: toolCall.id,
          });
        } catch (toolError) {
          console.error(`Tool call failed: ${toolError.message}`);
          // Include error information so the LLM can handle it appropriately
          messages.push({
            role: 'tool',
            content: `Error executing ${toolCall.function.name}: ${toolError.message}`,
            tool_call_id: toolCall.id,
          });
        }
      }

      // Get the LLM's response incorporating tool call results
      response = await llm.chatCompletions({
        model: llm.Model.BASE,
        messages,
        tools,
      });
    }

    return response.choices[0].message.content || 'No response received';
  } catch (error) {
    console.error('Failed to use MCP with LLM:', error);
    throw new Error(`MCP + LLM request failed: ${error.message}`);
  }
}
```

You have now built a complete AI agent that can actively interact with your Grafana environment. Your LLM can query real data, check system status, and provide contextual recommendations based on live information.

## Use MCP client in React components

You can use the `mcp.MCPClientProvider` component and the `useMCPClient` hook to access the MCP client from React components. This approach handles the boilerplate code for checking availability and initializing the client.

### 1. Set up the MCP provider

The MCP client initialization is asynchronous and may fail if the service is unavailable. Use `Suspense` to handle the loading state while the client connects, and `ErrorBoundary` to gracefully handle any connection failures or configuration issues.

To set up the MCP provider in your React application, follow these steps:

```tsx
import React, { Suspense } from 'react';
import { mcp } from '@grafana/llm';
import { ErrorBoundary, Spinner } from '@grafana/ui';

function App() {
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
              <MyComponent />
            </mcp.MCPClientProvider>
          );
        }}
      </ErrorBoundary>
    </Suspense>
  );
}
```

### 2. Use the MCP client in components

To use the MCP client within your React components, follow these steps:

This component demonstrates how to safely access MCP functionality within React. The `useMCPClient` hook automatically handles client initialization and provides proper error boundaries:

```tsx
import React from 'react';
import { mcp } from '@grafana/llm';
import { Alert, LoadingPlaceholder } from '@grafana/ui';
import { useAsync } from 'react-use';

function MyComponent() {
  // The useMCPClient hook provides a ready-to-use MCP client
  // It handles all initialization and error states automatically
  const { client, enabled } = mcp.useMCPClient();

  // Fetch available tools asynchronously with proper dependency tracking
  const { loading, error, value: toolsResponse } = useAsync(async () => {
    if (!enabled || !client) {
      return null;
    }
    return await client.listTools();
  }, [client]);

  // Show loading state while tools are being fetched
  if (loading) {
    return <LoadingPlaceholder label="Loading MCP tools..." />;
  }

  // Display error state with actionable information
  if (error) {
    return (
      <Alert title="Failed to load MCP tools" severity="error">
        {error.message}
        <br />
        Ensure the Grafana LLM app is properly configured with MCP enabled.
      </Alert>
    );
  }

  const tools = toolsResponse?.tools ?? [];

  return (
    <div>
      <h3>Available MCP Tools</h3>
      {tools.length === 0 ? (
        <Alert title="No tools available" severity="info">
          No MCP tools are currently available. Check your Grafana LLM app configuration.
        </Alert>
      ) : (
        <div>
          <p>Found {tools.length} tools available for use:</p>
          <ul>
            {tools.map((tool, index) => (
              <li key={tool.name || index}>
                <strong>{tool.name}</strong>
                {tool.description && (
                  <>: {tool.description}</>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

You have successfully integrated both LLM and MCP functionality into React components with proper error handling and loading states.

## Troubleshooting

The following debugging strategies help you identify and resolve common problems with LLM and MCP integration.

### LLM service not available

**Problem**: `llm.enabled()` returns `false` or throws an error.

**Debug steps**:
1. **Check plugin installation**: Navigate to **Administration** > **Plugins** and verify the Grafana LLM app is installed and enabled
2. **Verify LLM configuration**: In the LLM app settings, ensure at least one LLM provider is configured with valid credentials
3. **Test the connection**: Use the LLM app's built-in connection test to verify your provider setup

**Code debugging**:
```typescript
// Add detailed logging to understand the failure
try {
  console.log('Checking LLM availability...');
  const enabled = await llm.enabled();
  console.log('LLM enabled status:', enabled);

  if (!enabled) {
    // Log detailed error information
    console.error('LLM service not available - check plugin configuration');
    return;
  }
} catch (error) {
  console.error('LLM availability check failed:', error);
  // Check if it's a network error, permissions issue, etc.
}
```

**Common solutions**:
- Restart the Grafana server after installing the LLM plugin
- Check browser network tab for failed API requests to `/api/plugins/grafana-llm-app/`
- Verify your plugin has the necessary capabilities in its `plugin.json`

### MCP connection fails

**Problem**: MCP client connection fails or `mcp.enabled()` returns `false`.

**Debug steps**:
1. **Version check**: Ensure you're using Grafana LLM app version 0.22 or later
2. **Network debugging**: Open browser DevTools and check for failed WebSocket or HTTP connections
3. **Service status**: Verify the MCP server is running by checking the LLM app status page

**Code debugging**:
```typescript
// Add connection debugging
async function debugMCPConnection() {
  try {
    console.log('Checking MCP availability...');
    const mcpEnabled = await mcp.enabled();
    console.log('MCP enabled:', mcpEnabled);

    if (!mcpEnabled) {
      console.error('MCP not available - check LLM app version >= 0.22');
      return;
    }

    const client = new mcp.Client({
      name: 'debug-client',
      version: '1.0.0',
    });

    const transport = new mcp.StreamableHTTPTransport(mcp.streamableHTTPUrl());
    console.log('MCP URL:', mcp.streamableHTTPUrl());

    await client.connect(transport);
    console.log('MCP connection successful');

    // Test basic functionality
    const capabilities = await client.getServerCapabilities();
    console.log('Server capabilities:', capabilities);

  } catch (error) {
    console.error('MCP connection failed:', {
      error: error.message,
      stack: error.stack,
      url: mcp.streamableHTTPUrl()
    });
  }
}
```

**Common solutions**:
- Update the Grafana LLM app to the latest version
- Check if proxy or firewall settings block WebSocket connections
- Verify the MCP server URL is accessible from your browser

### Tool calls fail

**Problem**: LLM attempts to call tools but the calls fail.

**Debug steps**:
1. **Validate tool availability**: List available tools before making calls
2. **Check argument format**: Ensure tool arguments match the expected schema
3. **Monitor tool execution**: Add logging around tool calls to identify failure points

**Code debugging**:
```typescript
// Add comprehensive tool call debugging
async function debugToolCalls(mcpClient: mcp.Client) {
  try {
    // First, list available tools
    const toolsResponse = await mcpClient.listTools();
    console.log('Available tools:', toolsResponse.tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    })));

    // Test a specific tool call
    const toolName = 'your-tool-name';
    const args = { /* your arguments */ };

    console.log(`Calling tool: ${toolName}`, args);
    const result = await mcpClient.callTool({
      name: toolName,
      arguments: args
    });

    console.log('Tool call result:', result);

  } catch (error) {
    console.error('Tool call debugging failed:', {
      error: error.message,
      toolName: toolName,
      arguments: args,
      stack: error.stack
    });
  }
}
```

**Common solutions**:
- Validate tool arguments against the tool's input schema before calling
- Handle tool call timeouts with appropriate retry logic
- Check Grafana logs for detailed MCP server error messages

### React component errors

**Problem**: React components using MCP hooks throw errors.

**Debug steps**:
1. **Check provider hierarchy**: Ensure `MCPClientProvider` wraps all components using MCP hooks
2. **Verify hook usage**: Confirm you're using hooks inside functional components
3. **Add error boundaries**: Implement proper error handling in your component tree

**Code debugging**:
```typescript
// Debug React component issues
function DebugMCPComponent() {
  const mcpClient = mcp.useMCPClient();

  // Add logging to understand the client state
  React.useEffect(() => {
    console.log('MCP client state:', {
      client: mcpClient,
      isConnected: mcpClient ? 'Available' : 'Not available'
    });
  }, [mcpClient]);

  if (!mcpClient) {
    console.warn('MCP client not available - check MCPClientProvider wrapper');
    return <div>MCP client not available</div>;
  }

  // Your component logic here
  return <div>MCP client ready</div>;
}

// Proper error boundary implementation
class MCPErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MCP component error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          <h4>MCP Component Error</h4>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

**Common solutions**:
- Always wrap MCP components with both `MCPClientProvider` and error boundaries
- Use conditional rendering to handle loading and error states
- Add proper TypeScript types for better debugging support
- Test your components in isolation to identify the specific failure point

## Next steps

After implementing LLM and MCP integration in your plugin, you have built functionality that can:
- Make intelligent recommendations using LLMs
- Stream responses for better user experience
- Execute real actions through MCP tools
- Handle errors gracefully in production

To extend your integration further:

- Dive deeper into the [Grafana LLM app documentation][Grafana LLM app] for advanced configuration options
- Check out the [Model Context Protocol specification][mcp] to master MCP concepts
- Experiment with different LLM providers and models to find what works best
- Polish your integration with robust loading states and error handling
- Add retry logic for failed requests to improve reliability
- Connect with the Grafana community for plugin development tips and support

[mcp]: https://modelcontextprotocol.io/
[Grafana LLM app]: https://grafana.com/grafana/plugins/grafana-llm-app/
[npm]: https://www.npmjs.com/package/@grafana/llm
[app-plugin-dev]: https://grafana.com/developers/plugin-tools/tutorials/build-an-app-plugin
