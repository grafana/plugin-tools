// Main application logic
class UpdateApp {
  constructor() {
    this.ws = null;
    this.migrations = [];
    this.selectedMigrations = new Set();
    this.isExecuting = false;

    this.init();
  }

  async init() {
    try {
      await this.connectWebSocket();
      await this.loadMigrations();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize the update interface');
    }
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };

      this.ws.onerror = (error) => {
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
    });
  }

  async loadMigrations() {
    try {
      const response = await fetch('/api/migrations');
      const data = await response.json();
      this.migrations = data.migrations || [];

      // Update the migration list component
      const migrationList = document.querySelector('migration-list');
      if (migrationList) {
        migrationList.setAttribute('migrations', JSON.stringify(this.migrations));
      }
    } catch (error) {
      console.error('Failed to load migrations:', error);
      this.showError('Failed to load migration information');
    }
  }

  setupEventListeners() {
    // Listen for custom events from web components
    document.addEventListener('migration-selected', (event) => {
      this.handleMigrationSelection(event.detail);
    });

    document.addEventListener('migration-deselected', (event) => {
      this.handleMigrationDeselection(event.detail);
    });

    document.addEventListener('preview-requested', (event) => {
      this.handlePreviewRequest(event.detail);
    });

    document.addEventListener('execution-started', (event) => {
      this.handleExecutionStart(event.detail);
    });
  }

  handleMigrationSelection(migrationId) {
    this.selectedMigrations.add(migrationId);
    this.updateExecutionButton();
  }

  handleMigrationDeselection(migrationId) {
    this.selectedMigrations.delete(migrationId);
    this.updateExecutionButton();
  }

  updateExecutionButton() {
    const startButton = document.querySelector('#start-update');
    if (startButton) {
      const hasSelection = this.selectedMigrations.size > 0;
      startButton.disabled = !hasSelection || this.isExecuting;
      startButton.textContent = this.isExecuting ? 'Executing...' : 'Start Update';
    }
  }

  async handlePreviewRequest(migrationId) {
    try {
      const response = await fetch(`/api/migrations/${migrationId}/preview`);
      const preview = await response.json();

      // Show preview modal
      const modal = document.createElement('preview-modal');
      modal.setAttribute('preview', JSON.stringify(preview));
      document.body.appendChild(modal);
    } catch (error) {
      console.error('Failed to load preview:', error);
      this.showError('Failed to load migration preview');
    }
  }

  async handleExecutionStart(selectedMigrations) {
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

  handleWebSocketMessage(message) {
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

  handleMigrationStarted(data) {
    const migrationCard = document.querySelector(`migration-card[migration-id="${data.migrationId}"]`);
    if (migrationCard) {
      migrationCard.setAttribute('status', 'running');
    }
  }

  handleMigrationProgress(data) {
    const progressTracker = document.querySelector('progress-tracker');
    if (progressTracker) {
      progressTracker.setAttribute('progress', data.progress.toString());
    }
  }

  handleMigrationCompleted(data) {
    const migrationCard = document.querySelector(`migration-card[migration-id="${data.migrationId}"]`);
    if (migrationCard) {
      migrationCard.setAttribute('status', 'completed');
    }
  }

  handleMigrationFailed(data) {
    const migrationCard = document.querySelector(`migration-card[migration-id="${data.migrationId}"]`);
    if (migrationCard) {
      migrationCard.setAttribute('status', 'failed');
      migrationCard.setAttribute('error', data.error);
    }
  }

  handleExecutionCompleted(data) {
    this.isExecuting = false;
    this.updateExecutionButton();

    if (data.success) {
      this.showSuccess('Migration execution completed successfully!');
    } else {
      this.showError('Migration execution failed. Check the logs for details.');
    }
  }

  showError(message) {
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
      document.body.removeChild(errorDiv);
    }, 5000);
  }

  showSuccess(message) {
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
      document.body.removeChild(successDiv);
    }, 5000);
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UpdateApp();
});
