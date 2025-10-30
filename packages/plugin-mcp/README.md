## Grafana Plugin MCP

An MCP server that helps with Grafana plugin development.

### Setup

```bash
# From repo root
npm install
npm -w packages/plugin-mcp run build
```

### Configure in clients

#### Cursor

Settings → Cursor Settings → Tools & MCP:

```json
{
  "mcpServers": {
    "Grafana Plugin MCP": {
      "command": "node",
      "args": ["<absolute path>/plugin-tools/packages/plugin-mcp/dist/index.js"]
    }
  }
}
```

Inspect with the MCP Inspector (preconfigured):

```bash
npm -w packages/plugin-mcp run inspect
```

### Development

```bash
# Watch build
npm -w packages/plugin-mcp run dev

# Lint
npm -w packages/plugin-mcp run lint

# Test
npm -w packages/plugin-mcp run test
```
