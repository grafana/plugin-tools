import stylesheet from './migration-card.css' with { type: 'css' };

interface MigrationInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

type MigrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

class MigrationCard extends HTMLElement {
  private migration: MigrationInfo | null = null;
  private selected = false;
  private status: MigrationStatus = 'pending';
  private error: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [stylesheet];
  }

  static get observedAttributes(): string[] {
    return ['migration', 'selected', 'status', 'error'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'migration' && newValue) {
      this.migration = JSON.parse(newValue);
      this.render();
    }
    if (name === 'selected') {
      this.selected = newValue === 'true';
      this.updateSelection();
    }
    if (name === 'status') {
      this.status = newValue as MigrationStatus;
      this.updateStatus();
    }
    if (name === 'error') {
      this.error = newValue;
      this.updateError();
    }
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    if (!this.migration) {
      return;
    }

    this.shadowRoot!.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="migration-title">${this.migration.name}</h3>
          <div class="migration-version">v${this.migration.version}</div>
        </div>
        <p class="migration-description">${this.migration.description}</p>
        <div class="risk-indicator risk-${this.migration.riskLevel || 'medium'}">
          <span>Risk: ${(this.migration.riskLevel || 'medium').toUpperCase()}</span>
        </div>
        <div class="card-actions">
          <div class="action-left">
            <div class="toggle-switch" id="toggle"></div>
            <button class="preview-btn" id="preview">Preview Changes</button>
          </div>
          <span class="status-badge status-${this.status}" id="status">${this.getStatusText()}</span>
        </div>
        ${this.status === 'running' ? '<div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>' : ''}
        ${this.error ? `<div class="error-message">${this.error}</div>` : ''}
      </div>
    `;
  }

  private setupEventListeners(): void {
    const toggle = this.shadowRoot!.querySelector('#toggle') as HTMLElement;
    const previewBtn = this.shadowRoot!.querySelector('#preview') as HTMLButtonElement;

    toggle.addEventListener('click', () => {
      if (this.status === 'running' || this.status === 'completed') {
        return;
      }
      this.toggleSelection();
    });

    previewBtn.addEventListener('click', () => {
      this.requestPreview();
    });
  }

  private toggleSelection(): void {
    this.selected = !this.selected;
    this.setAttribute('selected', this.selected.toString());

    // Dispatch custom event
    const eventType = this.selected ? 'migration-selected' : 'migration-deselected';
    document.dispatchEvent(
      new CustomEvent(eventType, {
        detail: { migrationId: this.migration!.id },
      })
    );
  }

  private updateSelection(): void {
    const toggle = this.shadowRoot!.querySelector('#toggle') as HTMLElement;
    if (toggle) {
      toggle.classList.toggle('active', this.selected);
    }
  }

  private updateStatus(): void {
    const card = this.shadowRoot!.querySelector('.card') as HTMLElement;
    const statusBadge = this.shadowRoot!.querySelector('#status') as HTMLElement;

    if (card) {
      card.className = `card ${this.status}`;
    }

    if (statusBadge) {
      statusBadge.className = `status-badge status-${this.status}`;
      statusBadge.textContent = this.getStatusText();
    }

    // Update toggle state based on status
    const toggle = this.shadowRoot!.querySelector('#toggle') as HTMLElement;
    if (toggle) {
      toggle.classList.toggle('disabled', this.status === 'running' || this.status === 'completed');
    }

    // Dispatch status change event
    document.dispatchEvent(
      new CustomEvent('migration-status-changed', {
        detail: {
          migrationId: this.migration!.id,
          status: this.status,
        },
      })
    );
  }

  private updateError(): void {
    if (this.error) {
      this.render(); // Re-render to show error message
    }
  }

  private getStatusText(): string {
    const statusMap: Record<MigrationStatus, string> = {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      skipped: 'Skipped',
    };
    return statusMap[this.status] || 'Unknown';
  }

  private requestPreview(): void {
    document.dispatchEvent(
      new CustomEvent('preview-requested', {
        detail: { migrationId: this.migration!.id },
      })
    );
  }
}

customElements.define('migration-card', MigrationCard);
