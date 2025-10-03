import stylesheet from './migration-dashboard.css' with { type: 'css' };

interface MigrationInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

type StatusType = 'ready' | 'executing';

class MigrationDashboard extends HTMLElement {
  private migrations: MigrationInfo[] = [];
  private selectedMigrations = new Set<string>();
  private isExecuting = false;
  private currentVersion = '';
  private targetVersion = '';
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [stylesheet];
  }

  static get observedAttributes(): string[] {
    return ['migrations', 'selected', 'executing', 'current-version', 'target-version'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'migrations' && newValue) {
      this.migrations = JSON.parse(newValue);
      this.render();
      // Pass migrations to the migration-list component
      this.updateMigrationList();
    }
    if (name === 'executing') {
      this.isExecuting = newValue === 'true';
      this.updateExecutionButton();
    }
    if (name === 'current-version' && newValue) {
      this.currentVersion = newValue;
      this.updateVersionInfo();
    }
    if (name === 'target-version' && newValue) {
      this.targetVersion = newValue;
      this.updateVersionInfo();
    }
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    this.shadowRoot!.innerHTML = template;
  }

  private setupEventListeners(): void {
    const startButton = this.shadowRoot!.querySelector('#start-update') as HTMLButtonElement;
    startButton.addEventListener('click', () => {
      this.startExecution();
    });

    // Listen for migration selection changes
    document.addEventListener('migration-selected', (event: Event) => {
      this.selectedMigrations.add((event as CustomEvent).detail.migrationId);
      this.updateSummary();
    });

    document.addEventListener('migration-deselected', (event: Event) => {
      this.selectedMigrations.delete((event as CustomEvent).detail.migrationId);
      this.updateSummary();
    });

    // Listen for migration status changes
    document.addEventListener('migration-status-changed', () => {
      this.updateSummary();
    });
  }

  private startExecution(): void {
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

  private updateExecutionButton(): void {
    const startButton = this.shadowRoot!.querySelector('#start-update') as HTMLButtonElement;
    const hasSelection = this.selectedMigrations.size > 0;

    startButton.disabled = !hasSelection || this.isExecuting;
    startButton.textContent = this.isExecuting ? 'Executing...' : 'Start Update';
  }

  private updateStatus(text: string, type: StatusType = 'ready'): void {
    const statusText = this.shadowRoot!.querySelector('#status-text') as HTMLElement;
    const statusDot = this.shadowRoot!.querySelector('#status-dot') as HTMLElement;

    statusText.textContent = text;
    statusDot.className = `status-dot ${type}`;
  }

  private updateMigrationList(): void {
    const migrationList = this.shadowRoot!.querySelector('migration-list');
    if (migrationList) {
      migrationList.setAttribute('migrations', JSON.stringify(this.migrations));
    } else {
      console.error('MigrationDashboard: migration-list not found in shadow root');
    }
  }

  private updateVersionInfo(): void {
    const currentVersion = this.shadowRoot!.querySelector('#current-version') as HTMLElement;
    const targetVersion = this.shadowRoot!.querySelector('#target-version') as HTMLElement;
    if (currentVersion) {
      currentVersion.textContent = this.currentVersion;
    }
    if (targetVersion) {
      targetVersion.textContent = this.targetVersion;
    }
  }

  private updateSummary(): void {
    const total = this.migrations.length;
    const selected = this.selectedMigrations.size;
    const executing = this.shadowRoot!.querySelectorAll('migration-card[status="running"]').length;
    const completed = this.shadowRoot!.querySelectorAll('migration-card[status="completed"]').length;
    const failed = this.shadowRoot!.querySelectorAll('migration-card[status="failed"]').length;

    const totalElement = this.shadowRoot!.querySelector('#total-migrations') as HTMLElement;
    const selectedElement = this.shadowRoot!.querySelector('#selected-migrations') as HTMLElement;
    const executingElement = this.shadowRoot!.querySelector('#executing-migrations') as HTMLElement;
    const completedElement = this.shadowRoot!.querySelector('#completed-migrations') as HTMLElement;
    const failedElement = this.shadowRoot!.querySelector('#failed-migrations') as HTMLElement;

    if (totalElement) {
      totalElement.textContent = total.toString();
    }
    if (selectedElement) {
      selectedElement.textContent = selected.toString();
    }
    if (executingElement) {
      executingElement.textContent = executing.toString();
    }
    if (completedElement) {
      completedElement.textContent = completed.toString();
    }
    if (failedElement) {
      failedElement.textContent = failed.toString();
    }
  }
}

const template = `<div class="dashboard">
  <div class="header">
    <div class="plugin-info">
      <h1>Plugin Update</h1>
      <div class="version-info">
        <span id="current-version"></span> →
        <span id="target-version"></span>
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
</div>`;

customElements.define('migration-dashboard', MigrationDashboard);
