class MigrationDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.migrations = [];
    this.selectedMigrations = new Set();
    this.isExecuting = false;
  }

  static get observedAttributes() {
    return ['migrations', 'selected', 'executing'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'migrations' && newValue) {
      this.migrations = JSON.parse(newValue);
      this.render();
    }
    if (name === 'executing') {
      this.isExecuting = newValue === 'true';
      this.updateExecutionButton();
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e1e5e9;
        }
        .plugin-info h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 28px;
          font-weight: 600;
        }
        .version-info {
          color: #7f8c8d;
          font-size: 16px;
          margin-top: 8px;
        }
        .actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 14px;
          color: #5a6c7d;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #27ae60;
        }
        .status-dot.executing {
          background: #3498db;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .content {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 30px;
        }
        .main-content {
          min-height: 400px;
        }
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .summary-card {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .summary-title {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 16px;
        }
        .summary-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f3f4;
        }
        .stat-item:last-child {
          border-bottom: none;
        }
        .stat-label {
          color: #5a6c7d;
          font-size: 14px;
        }
        .stat-value {
          font-weight: 600;
          color: #2c3e50;
        }
        .stat-value.selected {
          color: #3498db;
        }
        .stat-value.executing {
          color: #f39c12;
        }
        .stat-value.completed {
          color: #27ae60;
        }
        .stat-value.failed {
          color: #e74c3c;
        }
        @media (max-width: 768px) {
          .content {
            grid-template-columns: 1fr;
          }
          .dashboard {
            padding: 16px;
          }
          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      </style>
      <div class="dashboard">
        <div class="header">
          <div class="plugin-info">
            <h1>Plugin Update</h1>
            <div class="version-info">
              <span id="current-version">v5.26.9</span> →
              <span id="target-version">v6.0.0</span>
            </div>
          </div>
          <div class="actions">
            <div class="status-indicator">
              <div class="status-dot" id="status-dot"></div>
              <span id="status-text">Ready</span>
            </div>
            <button id="start-update" class="btn btn-primary">Start Update</button>
          </div>
        </div>
        <div class="content">
          <div class="main-content">
            <migration-list></migration-list>
          </div>
          <div class="sidebar">
            <div class="summary-card">
              <div class="summary-title">Update Summary</div>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Migrations</span>
                  <span class="stat-value" id="total-migrations">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Selected</span>
                  <span class="stat-value selected" id="selected-migrations">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Executing</span>
                  <span class="stat-value executing" id="executing-migrations">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Completed</span>
                  <span class="stat-value completed" id="completed-migrations">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Failed</span>
                  <span class="stat-value failed" id="failed-migrations">0</span>
                </div>
              </div>
            </div>
            <progress-tracker></progress-tracker>
            <log-viewer></log-viewer>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const startButton = this.shadowRoot.querySelector('#start-update');
    startButton.addEventListener('click', () => {
      this.startExecution();
    });

    // Listen for migration selection changes
    document.addEventListener('migration-selected', (event) => {
      this.selectedMigrations.add(event.detail.migrationId);
      this.updateSummary();
    });

    document.addEventListener('migration-deselected', (event) => {
      this.selectedMigrations.delete(event.detail.migrationId);
      this.updateSummary();
    });

    // Listen for migration status changes
    document.addEventListener('migration-status-changed', (event) => {
      this.updateSummary();
    });
  }

  startExecution() {
    if (this.selectedMigrations.size === 0) {
      alert('Please select at least one migration to execute.');
      return;
    }

    this.isExecuting = true;
    this.setAttribute('executing', 'true');
    this.updateExecutionButton();
    this.updateStatus('Executing...', 'executing');

    // Dispatch event to start execution
    document.dispatchEvent(
      new CustomEvent('execution-started', {
        detail: { migrations: Array.from(this.selectedMigrations) },
      })
    );
  }

  updateExecutionButton() {
    const startButton = this.shadowRoot.querySelector('#start-update');
    const hasSelection = this.selectedMigrations.size > 0;

    startButton.disabled = !hasSelection || this.isExecuting;
    startButton.textContent = this.isExecuting ? 'Executing...' : 'Start Update';
  }

  updateStatus(text, type = 'ready') {
    const statusText = this.shadowRoot.querySelector('#status-text');
    const statusDot = this.shadowRoot.querySelector('#status-dot');

    statusText.textContent = text;
    statusDot.className = `status-dot ${type}`;
  }

  updateSummary() {
    const total = this.migrations.length;
    const selected = this.selectedMigrations.size;
    const executing = this.shadowRoot.querySelectorAll('migration-card[status="running"]').length;
    const completed = this.shadowRoot.querySelectorAll('migration-card[status="completed"]').length;
    const failed = this.shadowRoot.querySelectorAll('migration-card[status="failed"]').length;

    this.shadowRoot.querySelector('#total-migrations').textContent = total;
    this.shadowRoot.querySelector('#selected-migrations').textContent = selected;
    this.shadowRoot.querySelector('#executing-migrations').textContent = executing;
    this.shadowRoot.querySelector('#completed-migrations').textContent = completed;
    this.shadowRoot.querySelector('#failed-migrations').textContent = failed;
  }
}

customElements.define('migration-dashboard', MigrationDashboard);
