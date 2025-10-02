import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import getPort from 'get-port';
import { output } from '../utils/utils.console.js';
import { UIServerConfig, WebSocketMessage } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class UIServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private clients: Set<any> = new Set();
  private port: number;
  private host: string;

  constructor(config: UIServerConfig = {}) {
    this.app = express();
    this.host = config.host || 'localhost';
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    // Serve static files from the static directory
    this.app.use(express.static(join(__dirname, 'static')));
  }

  private setupRoutes() {
    // Serve the main HTML file for the root path
    this.app.get('/', (req, res) => {
      res.sendFile(join(__dirname, 'static', 'index.html'));
    });

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Basic migration endpoint (placeholder)
    this.app.get('/api/migrations', (req, res) => {
      res.json({ migrations: [] });
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
