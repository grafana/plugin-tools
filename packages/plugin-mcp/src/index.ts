import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './registerAllTools';
import { initLogger, logger } from './logger';

async function main() {
  const server = new McpServer({
    name: 'Grafana Plugin MCP',
    version: '1.0.0',
    capabilities: {
      prompts: {},
      resources: {},
      tools: {},
    },
  });

  registerAllTools(server);

  const transport = new StdioServerTransport();

  transport.onmessage = (message: Record<string, any>) => {
    console.error(message);
    if (!message) {
      return;
    }

    if (!message.method) {
      return;
    }

    if (message.method !== 'initialize' && message.method !== 'notifications/initialized') {
      return;
    }

    if (message.method === 'initialize') {
      initLogger(
        message.params?.clientInfo?.name,
        message.params?.clientInfo?.version,
        message.params?.protocolVersion
      );
    }

    if (message.method === 'notifications/initialized') {
      logger.info({ msg: `Grafana Plugin MCP connected 🚀` });
    }
  };
  await server.connect(transport);
}

main().catch((error) => {
  logger.error('Fatal error in main():', error);
  process.exit(1);
});
