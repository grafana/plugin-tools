interface MigrationInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

class MigrationList extends HTMLElement {
  private migrations: MigrationInfo[] = [];
  private allSelected = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return ['migrations'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'migrations' && newValue) {
      this.migrations = JSON.parse(newValue);
      this.render();
    }
  }

  connectedCallback(): void {
    this.render();
  }

  private render(): void {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .migration-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .list-title {
          font-size: 20px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }
        .list-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .toggle-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .toggle-label {
          font-size: 14px;
          color: #5a6c7d;
          font-weight: 500;
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
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #7f8c8d;
        }
        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #5a6c7d;
        }
        .empty-state p {
          margin: 0;
          font-size: 14px;
        }
        .loading-state {
          text-align: center;
          padding: 40px 20px;
          color: #7f8c8d;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #ecf0f1;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div class="migration-list">
        <div class="list-header">
          <h2 class="list-title">Available Migrations</h2>
          <div class="list-actions">
            <div class="toggle-container">
              <span class="toggle-label">Select All</span>
              <div class="toggle-switch" id="select-all-toggle"></div>
            </div>
          </div>
        </div>
        <div id="migrations-container">
          ${this.renderMigrations()}
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.updateToggleState();
  }

  private renderMigrations(): string {
    if (this.migrations.length === 0) {
      return `
        <div class="empty-state">
          <h3>No migrations available</h3>
          <p>Your plugin is already up to date.</p>
        </div>
      `;
    }

    return this.migrations
      .map(
        (migration) => `
      <migration-card
        migration='${JSON.stringify(migration)}'
        migration-id="${migration.id}"
      ></migration-card>
    `
      )
      .join('');
  }

  private setupEventListeners(): void {
    const toggleSwitch = this.shadowRoot!.querySelector('#select-all-toggle') as HTMLElement;

    if (toggleSwitch) {
      toggleSwitch.addEventListener('click', () => {
        this.toggleAllMigrations();
      });
    }
  }

  private toggleAllMigrations(): void {
    this.allSelected = !this.allSelected;
    this.updateToggleState();

    if (this.allSelected) {
      this.selectAllMigrations();
    } else {
      this.deselectAllMigrations();
    }
  }

  private updateToggleState(): void {
    const toggleSwitch = this.shadowRoot!.querySelector('#select-all-toggle') as HTMLElement;
    if (toggleSwitch) {
      toggleSwitch.classList.toggle('active', this.allSelected);
    }
  }

  private selectAllMigrations(): void {
    this.migrations.forEach((migration) => {
      const migrationCard = this.shadowRoot!.querySelector(`migration-card[migration-id="${migration.id}"]`);
      if (migrationCard) {
        migrationCard.setAttribute('selected', 'true');
      }
    });
  }

  private deselectAllMigrations(): void {
    this.migrations.forEach((migration) => {
      const migrationCard = this.shadowRoot!.querySelector(`migration-card[migration-id="${migration.id}"]`);
      if (migrationCard) {
        migrationCard.setAttribute('selected', 'false');
      }
    });
  }
}

customElements.define('migration-list', MigrationList);
