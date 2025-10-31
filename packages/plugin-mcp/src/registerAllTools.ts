import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { scaffoldPluginTool } from './tools/scaffoldPluginTool';

export function registerAllTools(server: McpServer) {
  scaffoldPluginTool(server);
}
