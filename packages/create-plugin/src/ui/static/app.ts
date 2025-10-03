// Main application logic
interface MigrationInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface WebSocketMessage {
  type: string;
  data: {
    migrationId?: string;
    progress?: number;
    error?: string;
    success?: boolean;
  };
}

interface MigrationPreview {
  migrationId: string;
  changes: Array<{
    path: string;
    type: 'added' | 'modified' | 'deleted';
    diff?: string;
  }>;
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
}

class UpdateApp {
  private ws: WebSocket | null = null;
  private migrations: MigrationInfo[] = [];
  private selectedMigrations = new Set<string>();
  private isExecuting = false;
  private currentVersion = '';
  private targetVersion = '';
  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      await this.connectWebSocket();
      await this.loadMigrations();
      await this.loadVersion();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize the update interface');
    }
  }

  private async loadVersion(): Promise<void> {
    const response = await fetch('/api/version');
    const data = (await response.json()) as { current_version: string; target_version: string };
    this.currentVersion = data.current_version;
    this.targetVersion = data.target_version;
    const migrationDashboard = document.querySelector('migration-dashboard');
    if (migrationDashboard) {
      migrationDashboard.setAttribute('current-version', this.currentVersion);
      migrationDashboard.setAttribute('target-version', this.targetVersion);
    } else {
      console.error('Migration dashboard element not found!');
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      this.ws = new WebSocket(wsUrl);

      if (this.ws) {
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        };

        this.ws.onerror = (error: Event) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            this.connectWebSocket().catch(console.error);
          }, 3000);
        };
      } else {
        reject(new Error('Failed to create WebSocket'));
      }
    });
  }

  private async loadMigrations(): Promise<void> {
    try {
      const response = await fetch('/api/migrations');
      const data = (await response.json()) as { migrations: MigrationInfo[] };
      this.migrations = data.migrations || [];

      const migrationDashboard = document.querySelector('migration-dashboard');

      if (migrationDashboard) {
        migrationDashboard.setAttribute('migrations', JSON.stringify(this.migrations));
      } else {
        console.error('Migration dashboard element not found!');
      }
    } catch (error) {
      console.error('Failed to load migrations:', error);
      this.showError('Failed to load migration information');
    }
  }

  private setupEventListeners(): void {
    // Listen for custom events from web components
    document.addEventListener('migration-selected', (event: Event) => {
      this.handleMigrationSelection((event as CustomEvent).detail);
    });

    document.addEventListener('migration-deselected', (event: Event) => {
      this.handleMigrationDeselection((event as CustomEvent).detail);
    });

    document.addEventListener('preview-requested', (event: Event) => {
      this.handlePreviewRequest((event as CustomEvent).detail);
    });

    document.addEventListener('execution-started', (event: Event) => {
      this.handleExecutionStart((event as CustomEvent).detail);
    });
  }

  private handleMigrationSelection(migrationId: string): void {
    this.selectedMigrations.add(migrationId);
    this.updateExecutionButton();
  }

  private handleMigrationDeselection(migrationId: string): void {
    this.selectedMigrations.delete(migrationId);
    this.updateExecutionButton();
  }

  private updateExecutionButton(): void {
    const startButton = document.querySelector('#start-update') as HTMLButtonElement;
    if (startButton) {
      const hasSelection = this.selectedMigrations.size > 0;
      startButton.disabled = !hasSelection || this.isExecuting;
      startButton.textContent = this.isExecuting ? 'Executing...' : 'Start Update';
    }
  }

  private async handlePreviewRequest(migrationId: { migrationId: string }): Promise<void> {
    try {
      console.log('handlePreviewRequest', migrationId);
      const response = await fetch(`/api/migrations/${migrationId}/preview`);
      const preview = (await response.json()) as MigrationPreview;

      // Show preview modal
      const modal = document.createElement('preview-modal');
      modal.setAttribute('preview', JSON.stringify(preview));
      document.body.appendChild(modal);
    } catch (error) {
      console.error('Failed to load preview:', error);
      this.showError('Failed to load migration preview');
    }
  }

  private async handleExecutionStart(selectedMigrations: string[]): Promise<void> {
    if (this.isExecuting) {
      return;
    }

    this.isExecuting = true;
    this.updateExecutionButton();

    try {
      const response = await fetch('/api/migrations/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          migrations: Array.from(selectedMigrations),
        }),
      });

      if (!response.ok) {
        throw new Error('Execution failed');
      }

      // Execution will be handled via WebSocket messages
    } catch (error) {
      console.error('Execution failed:', error);
      this.showError('Failed to start migration execution');
      this.isExecuting = false;
      this.updateExecutionButton();
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'migration_started':
        this.handleMigrationStarted(message.data);
        break;
      case 'migration_progress':
        this.handleMigrationProgress(message.data);
        break;
      case 'migration_completed':
        this.handleMigrationCompleted(message.data);
        break;
      case 'migration_failed':
        this.handleMigrationFailed(message.data);
        break;
      case 'execution_completed':
        this.handleExecutionCompleted(message.data);
        break;
      default:
        console.log('Unknown WebSocket message:', message);
    }
  }

  private handleMigrationStarted(data: WebSocketMessage['data']): void {
    const migrationCard = document.querySelector(`migration-card[migration-id="${data.migrationId}"]`);
    if (migrationCard) {
      migrationCard.setAttribute('status', 'running');
    }
  }

  private handleMigrationProgress(data: WebSocketMessage['data']): void {
    const progressTracker = document.querySelector('progress-tracker');
    if (progressTracker && data.progress !== undefined) {
      progressTracker.setAttribute('progress', data.progress.toString());
    }
  }

  private handleMigrationCompleted(data: WebSocketMessage['data']): void {
    const migrationCard = document.querySelector(`migration-card[migration-id="${data.migrationId}"]`);
    if (migrationCard) {
      migrationCard.setAttribute('status', 'completed');
    }
  }

  private handleMigrationFailed(data: WebSocketMessage['data']): void {
    const migrationCard = document.querySelector(`migration-card[migration-id="${data.migrationId}"]`);
    if (migrationCard) {
      migrationCard.setAttribute('status', 'failed');
      if (data.error) {
        migrationCard.setAttribute('error', data.error);
      }
    }
  }

  private handleExecutionCompleted(data: WebSocketMessage['data']): void {
    this.isExecuting = false;
    this.updateExecutionButton();

    if (data.success) {
      this.showSuccess('Migration execution completed successfully!');
    } else {
      this.showError('Migration execution failed. Check the logs for details.');
    }
  }

  private showError(message: string): void {
    // Simple error display - could be enhanced with a proper notification system
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 16px;
      border-radius: 6px;
      z-index: 1000;
    `;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 5000);
  }

  private showSuccess(message: string): void {
    // Simple success display - could be enhanced with a proper notification system
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #27ae60;
      color: white;
      padding: 16px;
      border-radius: 6px;
      z-index: 1000;
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 5000);
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UpdateApp();
});
