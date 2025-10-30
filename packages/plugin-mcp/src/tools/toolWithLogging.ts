import { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { ZodRawShape } from 'zod';
import { logger } from '../logger';

export function toolWithLogging<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape>(
  server: McpServer,
  name: string,
  config: {
    title?: string;
    description?: string;
    inputSchema?: InputArgs;
    outputSchema?: OutputArgs;
    annotations?: ToolAnnotations;
    _meta?: Record<string, unknown>;
  },
  cb: ToolCallback<InputArgs>
) {
  const loggingHandler = (async (args, extra) => {
    const startedAt = Date.now();
    try {
      logger.info({ msg: `tools/call start`, tool: name, args });
      const result = await cb(args, extra);
      logger.info({ msg: `tools/call success`, tool: name, duration: Date.now() - startedAt });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err?.message : String(err);
      logger.error({ msg: `tools/call error`, tool: name, duration: Date.now() - startedAt, error });
      throw err;
    }
  }) as ToolCallback<InputArgs>;

  server.registerTool(name, config, loggingHandler);
}
