class MigrationList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.migrations = [];
  }

  static get observedAttributes() {
    return ['migrations'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'migrations' && newValue) {
      this.migrations = JSON.parse(newValue);
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
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
  }

  renderMigrations() {
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

  setupEventListeners() {
    const selectAllBtn = this.shadowRoot.querySelector('#select-all');
    const deselectAllBtn = this.shadowRoot.querySelector('#deselect-all');

    selectAllBtn.addEventListener('click', () => {
      this.selectAllMigrations();
    });

    deselectAllBtn.addEventListener('click', () => {
      this.deselectAllMigrations();
    });
  }

  selectAllMigrations() {
    this.migrations.forEach((migration) => {
      const migrationCard = this.shadowRoot.querySelector(`migration-card[migration-id="${migration.id}"]`);
      if (migrationCard) {
        migrationCard.setAttribute('selected', 'true');
      }
    });
  }

  deselectAllMigrations() {
    this.migrations.forEach((migration) => {
      const migrationCard = this.shadowRoot.querySelector(`migration-card[migration-id="${migration.id}"]`);
      if (migrationCard) {
        migrationCard.setAttribute('selected', 'false');
      }
    });
  }
}

customElements.define('migration-list', MigrationList);
