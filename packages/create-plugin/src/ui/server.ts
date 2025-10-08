import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import getPort from 'get-port';
import { output } from '../utils/utils.console.js';
import { UIServerConfig, WebSocketMessage } from './types.js';
import { getMigrationsToRun, runMigration, runMigrations } from '../migrations/manager.js';
import { getConfig, setRootConfig } from '../utils/utils.config.js';
import { CURRENT_APP_VERSION } from '../utils/utils.version.js';
import { MigrationMeta } from '../migrations/migrations.js';
import { Context } from '../migrations/context.js';
import { readFileSync } from 'fs';
import { getPluginJson } from '../utils/utils.plugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class UIServer {
  private app: express.Application;
  private server: any;
  private wss!: WebSocketServer;
  private clients: Set<any> = new Set();
  public port!: number;
  private host: string;
  private version: string;
  private migrations: Record<string, MigrationMeta>;
  private pluginMeta: unknown;
  constructor(config: UIServerConfig = {}) {
    this.app = express();
    this.host = config.host || 'localhost';
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.version = getConfig().version;
    this.pluginMeta = getPluginJson();
    this.migrations = getMigrationsToRun(this.version, CURRENT_APP_VERSION);
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    // Serve static files from the static directory
    this.app.use(express.static(join(__dirname, 'static')));
  }

  private setupRoutes() {
    // Serve the main HTML file for the root path
    this.app.get('/', (_req, res) => {
      res.sendFile(join(__dirname, 'static', 'index.html'));
    });

    // Health check endpoint
    this.app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/api/pluginMeta', (_req, res) => {
      res.json({
        target_version: CURRENT_APP_VERSION,
        current_version: this.version,
        pluginId: (this.pluginMeta as unknown as { id: string }).id,
      });
    });

    // Migration endpoint - returns available migrations for the current plugin
    this.app.get('/api/migrations', async (_req, res) => {
      try {
        const migrations = this.migrations;

        // Convert migrations to UI-friendly format
        const migrationList = Object.entries(migrations).map(([key, meta]) => ({
          id: key,
          name: key,
          version: meta.version,
          description: meta.description,
          dependencies: [],
          riskLevel: 'medium' as const,
        }));

        res.json({ migrations: migrationList });
      } catch (error) {
        output.error({
          title: 'Failed to load migrations',
          body: [error instanceof Error ? error.message : String(error)],
        });
        res.status(500).json({ error: 'Failed to load migrations' });
      }
    });

    // Migration execution endpoint
    this.app.post('/api/migrations/execute', async (req, res) => {
      try {
        const { migrations: selectedMigrations } = req.body;
        const allMigrations = this.migrations;

        // Filter to only selected migrations
        const migrationsToRun = Object.fromEntries(
          Object.entries(allMigrations).filter(([key]) => selectedMigrations.includes(key))
        );

        if (Object.keys(migrationsToRun).length === 0) {
          return res.status(400).json({ error: 'No valid migrations selected' });
        }

        // Execute migrations
        await runMigrations(migrationsToRun, { commitEachMigration: false });
        setRootConfig({ version: CURRENT_APP_VERSION });
        return res.json({ success: true, message: 'Migrations completed successfully' });
      } catch (error) {
        output.error({
          title: 'Migration execution failed',
          body: [error instanceof Error ? error.message : String(error)],
        });
        return res.status(500).json({ error: 'Migration execution failed' });
      }
    });

    this.app.get('/api/migrations/:migrationId/preview', async (req, res) => {
      const { migrationId } = req.params;
      const migration = this.migrations[migrationId];
      const basePath = process.cwd();
      const preview = await runMigration(migration, new Context(basePath));
      const response = { ...preview, originalFiles: {} as Record<string, string> };
      for (const file of Object.entries(preview.listChanges())) {
        const [filePath, { changeType }] = file;
        // TODO: get original file content and add to response
        if (changeType === 'update') {
          try {
            const originalContent = readFileSync(join(basePath, filePath), 'utf-8');

            response.originalFiles[filePath] = originalContent;
          } catch (error) {
            output.error({
              title: 'Failed to read original file content',
              body: [error instanceof Error ? error.message : String(error)],
            });
          }
        }
      }

      return res.json(response);
    });

    // Server shutdown endpoint
    this.app.post('/api/shutdown', async (_req, res) => {
      try {
        res.json({ success: true, message: 'Server shutting down...' });

        // Give the response time to send before shutting down
        setTimeout(() => {
          this.stop();
          process.exit(0);
        }, 100);
      } catch (error) {
        output.error({
          title: 'Failed to shutdown server',
          body: [error instanceof Error ? error.message : String(error)],
        });
        res.status(500).json({ error: 'Failed to shutdown server' });
      }
    });
  }

  private setupWebSocket() {
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      output.log({
        title: 'WebSocket client connected',
      });

      ws.on('message', (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleWebSocketMessage(message, ws);
        } catch (error) {
          output.error({
            title: 'Invalid WebSocket message',
            body: [error instanceof Error ? error.message : String(error)],
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        output.log({
          title: 'WebSocket client disconnected',
        });
      });
    });
  }

  private handleWebSocketMessage(message: WebSocketMessage, ws: any) {
    // Handle different message types
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', data: { timestamp: Date.now() } }));
        break;
      default:
        output.log({
          title: 'Unknown WebSocket message type',
          body: [message.type],
        });
    }
  }

  public broadcast(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  public async start(): Promise<void> {
    try {
      this.port = await getPort({ port: 3000 });

      this.server.listen(this.port, this.host, () => {
        output.success({
          title: 'UI Server started',
          body: [`Server running at http://${this.host}:${this.port}`, 'Press Ctrl+C to stop the server'],
        });
      });
    } catch (error) {
      output.error({
        title: 'Failed to start UI server',
        body: [error instanceof Error ? error.message : String(error)],
      });
      throw error;
    }
  }

  public stop(): void {
    this.server.close();
    this.wss.close();
    output.log({
      title: 'UI Server stopped',
    });
  }
}
