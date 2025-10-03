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
        .select-all-btn {
          background: none;
          border: 1px solid #3498db;
          color: #3498db;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .select-all-btn:hover {
          background: #3498db;
          color: white;
        }
        .deselect-all-btn {
          background: none;
          border: 1px solid #95a5a6;
          color: #95a5a6;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .deselect-all-btn:hover {
          background: #95a5a6;
          color: white;
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
            <button class="select-all-btn" id="select-all">Select All</button>
            <button class="deselect-all-btn" id="deselect-all">Deselect All</button>
          </div>
        </div>
        <div id="migrations-container">
          ${this.renderMigrations()}
        </div>
      </div>
    `;

    this.setupEventListeners();
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
    const selectAllBtn = this.shadowRoot!.querySelector('#select-all') as HTMLButtonElement;
    const deselectAllBtn = this.shadowRoot!.querySelector('#deselect-all') as HTMLButtonElement;

    selectAllBtn.addEventListener('click', () => {
      this.selectAllMigrations();
    });

    deselectAllBtn.addEventListener('click', () => {
      this.deselectAllMigrations();
    });
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
