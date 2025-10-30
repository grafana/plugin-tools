import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { PluginMcpTools } from '../constants';
import { toolWithLogging } from './toolWithLogging';

export function scaffoldPluginTool(server: McpServer) {
  return toolWithLogging(
    server,
    PluginMcpTools.scaffoldPlugin,
    {
      description: `Scaffolds or creates a Grafana plugin
Grafana plugin development allows you to create many different types of user experiences. For example, you can make:

Panel plugins - new ways of visualizing data
Data source plugins - connections to a new database or other source of data
App plugins - integrated out-of-the-box experiences

Tip
If this is your first time creating a plugin, we recommend that you familiarize yourself with the fundamentals of plugin types, frontend and backend components, data frames, and other essentials. 
Learn more about the key concepts of Grafana plugin development at https://grafana.com/developers/plugin-tools/key-concepts/`,
      inputSchema: {
        type: z
          .enum(['app', 'datasource', 'panel'])
          .optional()
          .default('app')
          .describe('plugin type, should be one of app, datasource or panel'),
        backend: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            'Add a backend to support server-side functionality? (calling external APIs, custom backend logic, advanced authentication, etc)'
          ),
        name: z.string().optional().default('myplugin').describe('name of your plugin'),
        org: z.string().optional().default('myorg').describe('your organization name (usually your Grafana Cloud org)'),
      },
    },
    async ({ backend, name, org, type }) => {
      return {
        content: [
          {
            name: PluginMcpTools.scaffoldPlugin,
            text: `Assistant should prompt user to execute the following command npx @grafana/create-plugin@latest -y --plugin-name='${name}' --org-name='${org}' --plugin-type='${type}' ${backend ? '--backend' : '--no-backend'}`,
            type: 'text',
          },
        ],
      };
    }
  );
}
