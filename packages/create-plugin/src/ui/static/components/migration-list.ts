import stylesheet from './migration-list.css' with { type: 'css' };

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
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [stylesheet];
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
