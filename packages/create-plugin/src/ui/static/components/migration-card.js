class MigrationCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.migration = null;
    this.selected = false;
    this.status = 'pending';
    this.error = null;
  }

  static get observedAttributes() {
    return ['migration', 'selected', 'status', 'error'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'migration' && newValue) {
      this.migration = JSON.parse(newValue);
      this.render();
    }
    if (name === 'selected') {
      this.selected = newValue === 'true';
      this.updateSelection();
    }
    if (name === 'status') {
      this.status = newValue;
      this.updateStatus();
    }
    if (name === 'error') {
      this.error = newValue;
      this.updateError();
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    if (!this.migration) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .card {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          background: white;
          transition: all 0.2s ease;
          position: relative;
        }
        .card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        .card.selected {
          border-color: #3498db;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
        }
        .card.executing {
          border-color: #f39c12;
          background: #fef9e7;
        }
        .card.completed {
          border-color: #27ae60;
          background: #f0f9f0;
        }
        .card.failed {
          border-color: #e74c3c;
          background: #fdf2f2;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .migration-title {
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
          font-size: 16px;
        }
        .migration-version {
          background: #ecf0f1;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #7f8c8d;
          font-weight: 500;
        }
        .migration-description {
          color: #5a6c7d;
          margin-bottom: 16px;
          line-height: 1.5;
          font-size: 14px;
        }
        .card-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
        }
        .action-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .toggle-switch {
          position: relative;
          width: 50px;
          height: 24px;
          background-color: #bdc3c7;
          border-radius: 12px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .toggle-switch.active {
          background-color: #3498db;
        }
        .toggle-switch.disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .toggle-switch.active::after {
          transform: translateX(26px);
        }
        .preview-btn {
          background: #95a5a6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }
        .preview-btn:hover:not(:disabled) {
          background: #7f8c8d;
        }
        .preview-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-pending {
          background-color: #f39c12;
          color: white;
        }
        .status-running {
          background-color: #3498db;
          color: white;
        }
        .status-completed {
          background-color: #27ae60;
          color: white;
        }
        .status-failed {
          background-color: #e74c3c;
          color: white;
        }
        .status-skipped {
          background-color: #95a5a6;
          color: white;
        }
        .risk-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 8px;
        }
        .risk-low {
          color: #27ae60;
        }
        .risk-medium {
          color: #f39c12;
        }
        .risk-high {
          color: #e74c3c;
        }
        .error-message {
          background: #fdf2f2;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-top: 12px;
          font-size: 14px;
        }
        .progress-bar {
          width: 100%;
          height: 4px;
          background-color: #ecf0f1;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }
        .progress-fill {
          height: 100%;
          background-color: #3498db;
          transition: width 0.3s ease;
          border-radius: 2px;
        }
      </style>
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

  setupEventListeners() {
    const toggle = this.shadowRoot.querySelector('#toggle');
    const previewBtn = this.shadowRoot.querySelector('#preview');

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

  toggleSelection() {
    this.selected = !this.selected;
    this.setAttribute('selected', this.selected.toString());

    // Dispatch custom event
    const eventType = this.selected ? 'migration-selected' : 'migration-deselected';
    document.dispatchEvent(
      new CustomEvent(eventType, {
        detail: { migrationId: this.migration.id },
      })
    );
  }

  updateSelection() {
    const toggle = this.shadowRoot.querySelector('#toggle');
    if (toggle) {
      toggle.classList.toggle('active', this.selected);
    }
  }

  updateStatus() {
    const card = this.shadowRoot.querySelector('.card');
    const statusBadge = this.shadowRoot.querySelector('#status');

    if (card) {
      card.className = `card ${this.status}`;
    }

    if (statusBadge) {
      statusBadge.className = `status-badge status-${this.status}`;
      statusBadge.textContent = this.getStatusText();
    }

    // Update toggle state based on status
    const toggle = this.shadowRoot.querySelector('#toggle');
    if (toggle) {
      toggle.classList.toggle('disabled', this.status === 'running' || this.status === 'completed');
    }

    // Dispatch status change event
    document.dispatchEvent(
      new CustomEvent('migration-status-changed', {
        detail: {
          migrationId: this.migration.id,
          status: this.status,
        },
      })
    );
  }

  updateError() {
    if (this.error) {
      this.render(); // Re-render to show error message
    }
  }

  getStatusText() {
    const statusMap = {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      skipped: 'Skipped',
    };
    return statusMap[this.status] || 'Unknown';
  }

  requestPreview() {
    document.dispatchEvent(
      new CustomEvent('preview-requested', {
        detail: { migrationId: this.migration.id },
      })
    );
  }
}

customElements.define('migration-card', MigrationCard);
